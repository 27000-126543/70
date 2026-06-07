import { create } from 'zustand';
import type {
  SimulationTask,
  SimulationStatus,
  BlackHoleParams,
  MagneticFieldConfig,
  InitialConditions,
  WarningEvent,
  AdjustmentLog,
  ApprovalRecord,
  ApprovalStatus,
  ParameterSeries,
  Recommendation,
  DailyStatistics,
  MonitoringData,
} from '../types';
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
} from '../data/mockEngine';

interface SimulationState {
  simulations: SimulationTask[];
  series: ParameterSeries[];
  recommendations: Recommendation[];
  dailyStats: DailyStatistics[];
  currentSimulation: SimulationTask | null;
  statusFilter: SimulationStatus | 'all';
  isSimulating: boolean;

  setStatusFilter: (f: SimulationStatus | 'all') => void;
  setCurrentSimulation: (id: string | null) => void;
  createSimulation: (data: {
    name: string;
    params: BlackHoleParams;
    magneticField: MagneticFieldConfig;
    initialConditions: InitialConditions;
    description?: string;
    parameterSeriesId?: string;
  }) => SimulationTask;
  updateSimulationStatus: (id: string, status: SimulationStatus) => void;
  updateSimulationProgress: (id: string, progress: number) => void;
  addMonitoringData: (id: string, data: MonitoringData) => void;
  addWarning: (id: string, warning: WarningEvent) => void;
  reviewWarning: (simId: string, warningId: string, reviewedBy: string, comment: string) => void;
  addAdjustmentLog: (id: string, log: AdjustmentLog) => void;
  addApproval: (id: string, record: ApprovalRecord) => void;
  setApprovalStatus: (id: string, status: ApprovalStatus) => void;
  pauseSeries: (seriesId: string) => void;
  resumeSeries: (seriesId: string) => void;
  getSimulationsByStatus: (status: SimulationStatus | 'all') => SimulationTask[];
  getWarnings: (onlyUnreviewed?: boolean) => WarningEvent[];
  getPendingApprovals: () => { simulation: SimulationTask }[];
  getStatistics: () => {
    total: number;
    byStatus: Record<SimulationStatus, number>;
    running: number;
    completed: number;
    completionRate: number;
    avgDuration: number;
    activeWarnings: number;
    pendingApprovals: number;
  };
  initializeMockData: () => void;
  tickSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulations: [],
  series: [],
  recommendations: [],
  dailyStats: [],
  currentSimulation: null,
  statusFilter: 'all',
  isSimulating: false,

  setStatusFilter: (f) => set({ statusFilter: f }),
  setCurrentSimulation: (id) =>
    set({ currentSimulation: id ? get().simulations.find((s) => s.id === id) || null : null }),

  createSimulation: (data) => {
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
      createdBy: '当前用户',
      description: data.description,
    };
    set((s) => ({ simulations: [task, ...s.simulations] }));
    setTimeout(() => get().updateSimulationStatus(task.id, 'mesh_generation'), 800);
    setTimeout(() => get().updateSimulationStatus(task.id, 'initializing'), 2000);
    setTimeout(() => get().updateSimulationStatus(task.id, 'evolving'), 3500);
    return task;
  },

  updateSimulationStatus: (id, status) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id
          ? {
              ...sim,
              status,
              endTime: status === 'completed' || status === 'error_fallback' ? Date.now() : sim.endTime,
              radiationData:
                status === 'completed' && !sim.radiationData ? generateRadiationData(id) : sim.radiationData,
              magneticField3D:
                status === 'completed' && !sim.magneticField3D ? generateMagneticField3D() : sim.magneticField3D,
              approvalStatus: status === 'completed' ? 'pending' : sim.approvalStatus,
            }
          : sim
      ),
      currentSimulation:
        s.currentSimulation && s.currentSimulation.id === id
          ? {
              ...s.currentSimulation,
              status,
              endTime: status === 'completed' || status === 'error_fallback' ? Date.now() : s.currentSimulation.endTime,
              radiationData:
                status === 'completed' && !s.currentSimulation.radiationData
                  ? generateRadiationData(id)
                  : s.currentSimulation.radiationData,
              magneticField3D:
                status === 'completed' && !s.currentSimulation.magneticField3D
                  ? generateMagneticField3D()
                  : s.currentSimulation.magneticField3D,
            }
          : s.currentSimulation,
    })),

  updateSimulationProgress: (id, progress) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id
          ? {
              ...sim,
              progress: Math.min(100, progress),
              currentStep: Math.floor((progress / 100) * sim.totalSteps),
              elapsedTime: Math.floor((Date.now() - sim.startTime) / 1000),
            }
          : sim
      ),
      currentSimulation:
        s.currentSimulation && s.currentSimulation.id === id
          ? {
              ...s.currentSimulation,
              progress: Math.min(100, progress),
              currentStep: Math.floor((progress / 100) * s.currentSimulation.totalSteps),
              elapsedTime: Math.floor((Date.now() - s.currentSimulation.startTime) / 1000),
            }
          : s.currentSimulation,
    })),

  addMonitoringData: (id, data) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id
          ? { ...sim, monitoringHistory: [...sim.monitoringHistory.slice(-200), data] }
          : sim
      ),
      currentSimulation:
        s.currentSimulation && s.currentSimulation.id === id
          ? {
              ...s.currentSimulation,
              monitoringHistory: [...s.currentSimulation.monitoringHistory.slice(-200), data],
            }
          : s.currentSimulation,
    })),

  addWarning: (id, warning) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id ? { ...sim, warnings: [warning, ...sim.warnings] } : sim
      ),
      currentSimulation:
        s.currentSimulation && s.currentSimulation.id === id
          ? { ...s.currentSimulation, warnings: [warning, ...s.currentSimulation.warnings] }
          : s.currentSimulation,
    })),

  reviewWarning: (simId, warningId, reviewedBy, comment) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === simId
          ? {
              ...sim,
              warnings: sim.warnings.map((w) =>
                w.id === warningId ? { ...w, reviewed: true, reviewedBy, reviewComment: comment } : w
              ),
            }
          : sim
      ),
    })),

  addAdjustmentLog: (id, log) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id ? { ...sim, adjustmentLog: [log, ...sim.adjustmentLog] } : sim
      ),
    })),

  addApproval: (id, record) =>
    set((s) => ({
      simulations: s.simulations.map((sim) =>
        sim.id === id ? { ...sim, approvals: [record, ...sim.approvals] } : sim
      ),
    })),

  setApprovalStatus: (id, status) =>
    set((s) => ({
      simulations: s.simulations.map((sim) => (sim.id === id ? { ...sim, approvalStatus: status } : sim)),
    })),

  pauseSeries: (seriesId) =>
    set((s) => ({
      series: s.series.map((ser) => (ser.id === seriesId ? { ...ser, status: 'paused' } : ser)),
    })),

  resumeSeries: (seriesId) =>
    set((s) => ({
      series: s.series.map((ser) =>
        ser.id === seriesId ? { ...ser, status: 'active', consecutiveDivergences: 0 } : ser
      ),
    })),

  getSimulationsByStatus: (status) => {
    const { simulations } = get();
    if (status === 'all') return simulations;
    return simulations.filter((s) => s.status === status);
  },

  getWarnings: (onlyUnreviewed = false) => {
    const { simulations } = get();
    const all = simulations.flatMap((s) => s.warnings.map((w) => ({ ...w, simName: s.name })));
    return onlyUnreviewed ? all.filter((w) => !w.reviewed) : all;
  },

  getPendingApprovals: () => {
    const { simulations } = get();
    return simulations
      .filter(
        (s) => s.status === 'completed' && (s.approvalStatus === 'pending' || s.approvalStatus === 'postdoc_approved')
      )
      .map((s) => ({ simulation: s }));
  },

  getStatistics: () => {
    const { simulations, dailyStats } = get();
    const total = simulations.length;
    const byStatus = {} as Record<SimulationStatus, number>;
    (['pending_validation', 'mesh_generation', 'initializing', 'evolving', 'radiation_synthesis', 'completed', 'error_fallback', 'paused'] as SimulationStatus[]).forEach(
      (k) => (byStatus[k] = 0)
    );
    simulations.forEach((s) => (byStatus[s.status] = (byStatus[s.status] || 0) + 1));
    const running = byStatus.evolving + byStatus.mesh_generation + byStatus.initializing + byStatus.radiation_synthesis;
    const completed = byStatus.completed;
    const completionRate = total > 0 ? completed / total : 0;
    const completedSims = simulations.filter((s) => s.status === 'completed');
    const avgDuration =
      completedSims.length > 0
        ? completedSims.reduce((a, s) => a + s.elapsedTime, 0) / completedSims.length
        : 0;
    const activeWarnings = simulations.reduce((a, s) => a + s.warnings.filter((w) => !w.reviewed).length, 0);
    const pendingApprovalCount = simulations.filter(
      (s) => s.status === 'completed' && s.approvalStatus !== 'professor_approved' && s.approvalStatus !== 'rejected' && s.approvalStatus !== 'pushed_to_proposal'
    ).length;
    return { total, byStatus, running, completed, completionRate, avgDuration, activeWarnings, pendingApprovals: pendingApprovalCount };
  },

  initializeMockData: () => {
    const sims = generateMockSimulations(12);
    set({
      simulations: sims,
      series: generateParameterSeries(),
      recommendations: generateRecommendations(4),
      dailyStats: generateDailyStatistics(14),
      isSimulating: true,
    });
  },

  tickSimulation: () => {
    const { simulations } = get();
    simulations.forEach((sim) => {
      if (sim.status === 'evolving' && sim.progress < 100) {
        const newProgress = Math.min(99, sim.progress + Math.random() * 0.8);
        get().updateSimulationProgress(sim.id, newProgress);
        const step = sim.currentStep + 1;
        get().addMonitoringData(sim.id, generateMonitoringData(sim.id, step));
        if (Math.random() < 0.02) {
          get().addWarning(sim.id, generateWarningEvent(sim.id));
        }
        if (newProgress >= 99) {
          setTimeout(() => {
            get().updateSimulationStatus(sim.id, 'radiation_synthesis');
            setTimeout(() => get().updateSimulationStatus(sim.id, 'completed'), 2500);
          }, 1500);
        }
      }
    });
  },
}));
