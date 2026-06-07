import { dataStore } from '../data/store.js';
import { wsService } from './ws.js';
import { generateMonitoringData, generateWarningEvent } from '../data/mockEngine.js';
import type { SimulationStatus } from '../types.js';

const STATUS_TRANSITIONS: Record<string, { next: SimulationStatus | null; durationMs: number }> = {
  pending_validation: { next: 'mesh_generation', durationMs: 1500 },
  mesh_generation: { next: 'initializing', durationMs: 2500 },
  initializing: { next: 'evolving', durationMs: 3500 },
  radiation_synthesis: { next: 'completed', durationMs: 3000 },
  evolving: { next: 'radiation_synthesis', durationMs: 0 },
  completed: { next: null, durationMs: 0 },
  error_fallback: { next: null, durationMs: 0 },
  paused: { next: null, durationMs: 0 },
};

class SimulationScheduler {
  private statusTimers: Map<string, NodeJS.Timeout> = new Map();
  private evolvingTimer: NodeJS.Timeout | null = null;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    console.log('[Scheduler] GRMHD simulation scheduler started');

    this.evolvingTimer = setInterval(() => this.tickEvolving(), 1500);
    this.bootstrapInitialSimulations();
  }

  private bootstrapInitialSimulations() {
    const sims = dataStore.getSimulations();
    sims.forEach((sim) => {
      if (
        sim.status === 'pending_validation' ||
        sim.status === 'mesh_generation' ||
        sim.status === 'initializing' ||
        sim.status === 'radiation_synthesis'
      ) {
        this.scheduleStatusTransition(sim.id, sim.status);
      }
    });
  }

  scheduleStatusTransition(simId: string, currentStatus: SimulationStatus) {
    const rule = STATUS_TRANSITIONS[currentStatus];
    if (!rule || !rule.next) return;

    const timerKey = `${simId}-${currentStatus}`;
    if (this.statusTimers.has(timerKey)) return;

    const timer = setTimeout(() => {
      this.statusTimers.delete(timerKey);
      this.transitionToNext(simId, currentStatus);
    }, rule.durationMs);

    this.statusTimers.set(timerKey, timer);
  }

  private transitionToNext(simId: string, currentStatus: SimulationStatus) {
    const rule = STATUS_TRANSITIONS[currentStatus];
    if (!rule || !rule.next) return;

    const nextStatus = rule.next;
    const updated = dataStore.updateSimulationStatus(simId, nextStatus);

    if (updated) {
      console.log(`[Scheduler] Sim ${simId.slice(0, 8)}: ${currentStatus} → ${nextStatus}`);

      wsService.broadcast('simulation:status', {
        simulationId: simId,
        status: nextStatus,
        simulation: updated,
      });

      if (nextStatus === 'completed') {
        console.log(`[Scheduler] Sim ${simId.slice(0, 8)} completed successfully`);
        wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });
      } else {
        this.scheduleStatusTransition(simId, nextStatus);
      }
    }
  }

  private tickEvolving() {
    const evolving = dataStore.getEvolvingSimulations();

    evolving.forEach((sim) => {
      const increment = Math.random() * 0.8 + 0.2;
      const newProgress = Math.min(99, sim.progress + increment);

      const updated = dataStore.updateSimulationProgress(sim.id, newProgress);

      if (updated) {
        wsService.broadcast('simulation:progress', {
          simulationId: sim.id,
          progress: updated.progress,
          currentStep: updated.currentStep,
          elapsedTime: updated.elapsedTime,
          simulation: updated,
        });

        const step = sim.currentStep + 1;
        const monitoring = generateMonitoringData(sim.id, step);
        dataStore.addMonitoringData(sim.id, monitoring);

        wsService.broadcast('simulation:monitoring', {
          simulationId: sim.id,
          data: monitoring,
        });

        if (Math.random() < 0.02) {
          const warning = generateWarningEvent(sim.id);
          dataStore.addWarning(sim.id, warning);
          wsService.broadcast('simulation:warning', {
            simulationId: sim.id,
            warning: { ...warning, simName: sim.name },
          });
          wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });
        }

        if (newProgress >= 99) {
          const updated2 = dataStore.updateSimulationStatus(sim.id, 'radiation_synthesis');
          if (updated2) {
            wsService.broadcast('simulation:status', {
              simulationId: sim.id,
              status: 'radiation_synthesis',
              simulation: updated2,
            });
            setTimeout(() => {
              const updated3 = dataStore.updateSimulationStatus(sim.id, 'completed');
              if (updated3) {
                wsService.broadcast('simulation:status', {
                  simulationId: sim.id,
                  status: 'completed',
                  simulation: updated3,
                });
                wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });
              }
            }, 3000);
          }
        }
      }
    });
  }

  startSimulation(simId: string) {
    this.scheduleStatusTransition(simId, 'pending_validation');
  }
}

export const scheduler = new SimulationScheduler();
