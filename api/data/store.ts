import type {
  SimulationTask,
  ParameterSeries,
  Recommendation,
  DailyStatistics,
  WarningEvent,
  MonitoringData,
  ApprovalRecord,
  AdjustmentLog,
  ObservationProposalLog,
  SimulationStatus,
  ApprovalStatus,
  BlackHoleParams,
  MagneticFieldConfig,
  InitialConditions,
} from '../types.js';
import {
  generateMockSimulations,
  generateParameterSeries,
  generateRecommendations,
  generateDailyStatistics,
  generateMonitoringData,
  generateWarningEvent,
  generateId,
  generateRadiationData,
  generateMagneticField3D,
} from './mockEngine.js';

class DataStore {
  private simulations: SimulationTask[] = [];
  private series: ParameterSeries[] = [];
  private recommendations: Recommendation[] = [];
  private dailyStats: DailyStatistics[] = [];
  private currentSimulation: SimulationTask | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.simulations = generateMockSimulations(12);
    this.series = generateParameterSeries();
    this.recommendations = generateRecommendations(4);
    this.dailyStats = generateDailyStatistics(14);
  }

  // ============ Simulations ============
  getSimulations(): SimulationTask[] {
    return this.simulations;
  }

  getSimulationById(id: string): SimulationTask | undefined {
    return this.simulations.find((s) => s.id === id);
  }

  getCurrentSimulation(): SimulationTask | null {
    return this.currentSimulation;
  }

  setCurrentSimulation(id: string | null): void {
    this.currentSimulation = id ? this.getSimulationById(id) || null : null;
  }

  createSimulation(data: {
    name: string;
    params: BlackHoleParams;
    magneticField: MagneticFieldConfig;
    initialConditions: InitialConditions;
    description?: string;
    parameterSeriesId?: string;
    createdBy?: string;
  }): { success: boolean; simulation?: SimulationTask; error?: string } {
    if (data.parameterSeriesId) {
      const ser = this.series.find((s) => s.id === data.parameterSeriesId);
      if (ser && (ser.status === 'paused' || ser.consecutiveDivergences >= 3)) {
        return {
          success: false,
          error: `该参数系列已因连续发散被自动暂停（连续发散${ser.consecutiveDivergences}次）`,
        };
      }
    }

    const task: SimulationTask = {
      id: generateId(),
      name: data.name,
      params: data.params,
      magneticField: data.magneticField,
      initialConditions: data.initialConditions,
      status: 'pending_validation',
      progress: 0,
      currentStep: 0,
      totalSteps: 5000,
      startTime: Date.now(),
      elapsedTime: 0,
      parameterSeriesId: data.parameterSeriesId,
      warnings: [],
      adjustmentLog: [],
      divergenceCount: 0,
      approvalStatus: 'pending',
      approvals: [],
      monitoringHistory: [],
      createdBy: data.createdBy || '当前用户',
      description: data.description,
    };
    this.simulations = [task, ...this.simulations];

    if (data.parameterSeriesId) {
      this.series = this.series.map((s) =>
        s.id === data.parameterSeriesId
          ? { ...s, simulations: [...s.simulations, task.id] }
          : s
      );
    }

    return { success: true, simulation: task };
  }

  updateSimulationStatus(id: string, status: SimulationStatus): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = {
          ...sim,
          status,
          endTime: status === 'completed' || status === 'error_fallback' ? Date.now() : sim.endTime,
          radiationData:
            status === 'completed' && !sim.radiationData ? generateRadiationData(id) : sim.radiationData,
          magneticField3D:
            status === 'completed' && !sim.magneticField3D ? generateMagneticField3D() : sim.magneticField3D,
          approvalStatus: status === 'completed' ? 'pending' : sim.approvalStatus,
          divergenceCount:
            status === 'error_fallback' ? sim.divergenceCount + 1 : sim.divergenceCount,
        };
        if (status === 'error_fallback' && sim.parameterSeriesId) {
          this.incrementSeriesDivergence(sim.parameterSeriesId);
        }
        if (this.currentSimulation?.id === id) {
          this.currentSimulation = updated;
        }
        return updated;
      }
      return sim;
    });
    return updated;
  }

  updateSimulationProgress(id: string, progress: number): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = {
          ...sim,
          progress: Math.min(100, progress),
          currentStep: Math.floor((progress / 100) * sim.totalSteps),
          elapsedTime: Math.floor((Date.now() - sim.startTime) / 1000),
        };
        if (this.currentSimulation?.id === id) this.currentSimulation = updated;
        return updated;
      }
      return sim;
    });
    return updated;
  }

  addMonitoringData(id: string, data: MonitoringData): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = {
          ...sim,
          monitoringHistory: [...sim.monitoringHistory.slice(-200), data],
        };
        if (this.currentSimulation?.id === id) this.currentSimulation = updated;
        return updated;
      }
      return sim;
    });
    return updated;
  }

  addWarning(id: string, warning: WarningEvent): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = { ...sim, warnings: [warning, ...sim.warnings] };
        if (this.currentSimulation?.id === id) this.currentSimulation = updated;
        return updated;
      }
      return sim;
    });
    return updated;
  }

  reviewWarning(simId: string, warningId: string, reviewedBy: string, comment: string): void {
    this.simulations = this.simulations.map((sim) =>
      sim.id === simId
        ? {
            ...sim,
            warnings: sim.warnings.map((w) =>
              w.id === warningId ? { ...w, reviewed: true, reviewedBy, reviewComment: comment } : w
            ),
          }
        : sim
    );
  }

  addAdjustmentLog(id: string, log: AdjustmentLog): void {
    this.simulations = this.simulations.map((sim) =>
      sim.id === id ? { ...sim, adjustmentLog: [log, ...sim.adjustmentLog] } : sim
    );
  }

  addApproval(id: string, record: ApprovalRecord): void {
    this.simulations = this.simulations.map((sim) =>
      sim.id === id ? { ...sim, approvals: [record, ...sim.approvals] } : sim
    );
  }

  setApprovalStatus(id: string, status: ApprovalStatus): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = { ...sim, approvalStatus: status };
        if (this.currentSimulation?.id === id) this.currentSimulation = updated;
        return updated;
      }
      return sim;
    });
    return updated;
  }

  setObservationProposal(id: string, proposal: ObservationProposalLog): SimulationTask | undefined {
    let updated: SimulationTask | undefined;
    this.simulations = this.simulations.map((sim) => {
      if (sim.id === id) {
        updated = { ...sim, observationProposal: proposal };
        if (this.currentSimulation?.id === id) this.currentSimulation = updated;
        return updated;
      }
      return sim;
    });
    return updated;
  }

  // ============ Parameter Series ============
  getSeries(): ParameterSeries[] {
    return this.series;
  }

  getSeriesById(id: string): ParameterSeries | undefined {
    return this.series.find((s) => s.id === id);
  }

  pauseSeries(seriesId: string): void {
    this.series = this.series.map((s) =>
      s.id === seriesId ? { ...s, status: 'paused' } : s
    );
  }

  resumeSeries(seriesId: string): void {
    this.series = this.series.map((s) =>
      s.id === seriesId ? { ...s, status: 'active', consecutiveDivergences: 0 } : s
    );
  }

  private incrementSeriesDivergence(seriesId: string): void {
    this.series = this.series.map((s) => {
      if (s.id === seriesId) {
        const newCount = s.consecutiveDivergences + 1;
        return {
          ...s,
          consecutiveDivergences: newCount,
          status: newCount >= 3 ? 'paused' : s.status,
        };
      }
      return s;
    });
  }

  // ============ Recommendations ============
  getRecommendations(): Recommendation[] {
    return this.recommendations;
  }

  // ============ Statistics ============
  getDailyStats(): DailyStatistics[] {
    return this.dailyStats;
  }

  getStatistics() {
    const byStatus = {} as Record<SimulationStatus, number>;
    ([
      'pending_validation',
      'mesh_generation',
      'initializing',
      'evolving',
      'radiation_synthesis',
      'completed',
      'error_fallback',
      'paused',
    ] as SimulationStatus[]).forEach((k) => (byStatus[k] = 0));
    this.simulations.forEach((s) => (byStatus[s.status] = (byStatus[s.status] || 0) + 1));
    const running = byStatus.evolving + byStatus.mesh_generation + byStatus.initializing + byStatus.radiation_synthesis;
    const completed = byStatus.completed;
    const total = this.simulations.length;
    const completionRate = total > 0 ? completed / total : 0;
    const completedSims = this.simulations.filter((s) => s.status === 'completed');
    const avgDuration =
      completedSims.length > 0
        ? completedSims.reduce((a, s) => a + s.elapsedTime, 0) / completedSims.length
        : 0;
    const activeWarnings = this.simulations.reduce((a, s) => a + s.warnings.filter((w) => !w.reviewed).length, 0);
    const pendingApprovals = this.simulations.filter(
      (s) =>
        s.status === 'completed' &&
        s.approvalStatus !== 'professor_approved' &&
        s.approvalStatus !== 'rejected' &&
        s.approvalStatus !== 'pushed_to_proposal'
    ).length;
    return {
      total,
      byStatus,
      running,
      completed,
      completionRate,
      avgDuration,
      activeWarnings,
      pendingApprovals,
    };
  }

  getWarnings(onlyUnreviewed = false) {
    const all = this.simulations.flatMap((s) =>
      s.warnings.map((w) => ({ ...w, simName: s.name }))
    );
    return onlyUnreviewed ? all.filter((w) => !w.reviewed) : all;
  }

  // Helpers for scheduler
  getEvolvingSimulations(): SimulationTask[] {
    return this.simulations.filter((s) => s.status === 'evolving' && s.progress < 100);
  }
}

export const dataStore = new DataStore();
