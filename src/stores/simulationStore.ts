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

type WSMessageType =
  | 'simulation:status'
  | 'simulation:progress'
  | 'simulation:monitoring'
  | 'simulation:warning'
  | 'simulation:approval'
  | 'simulation:created'
  | 'series:updated'
  | 'stats:updated';
interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  payload: any;
}
import {
  generateMockSimulations,
  generateParameterSeries,
  generateRecommendations,
  generateDailyStatistics,
} from '../data/mockEngine';

const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

interface SimulationState {
  simulations: SimulationTask[];
  series: ParameterSeries[];
  recommendations: Recommendation[];
  dailyStats: DailyStatistics[];
  currentSimulation: SimulationTask | null;
  statusFilter: SimulationStatus | 'all';
  wsConnected: boolean;
  wsError: string | null;

  setStatusFilter: (f: SimulationStatus | 'all') => void;
  setCurrentSimulation: (id: string | null) => void;
  createSimulation: (data: {
    name: string;
    params: BlackHoleParams;
    magneticField: MagneticFieldConfig;
    initialConditions: InitialConditions;
    description?: string;
    parameterSeriesId?: string;
  }) => Promise<{ success: boolean; simulation?: SimulationTask; error?: string }>;
  updateSimulationStatus: (id: string, status: SimulationStatus) => Promise<void>;
  reviewWarning: (simId: string, warningId: string, reviewedBy: string, comment: string, approved: boolean) => Promise<void>;
  addAdjustmentLog: (id: string, log: AdjustmentLog) => void;
  addApproval: (id: string, record: ApprovalRecord) => Promise<void>;
  setApprovalStatus: (id: string, status: ApprovalStatus) => Promise<void>;
  pushToObservationProposal: (id: string, pushedBy?: string) => Promise<{ success: boolean; error?: string }>;
  pauseSeries: (seriesId: string) => Promise<void>;
  resumeSeries: (seriesId: string) => Promise<void>;
  getSimulationsByStatus: (status: SimulationStatus | 'all') => SimulationTask[];
  getWarnings: (onlyUnreviewed?: boolean) => (WarningEvent & { simName?: string })[];
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
  fetchInitialData: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  generateReportPDF: (simId: string) => Promise<void>;
}

let ws: WebSocket | null = null;
let wsReconnectTimer: NodeJS.Timeout | null = null;

function createWSConnection(set: any, get: any) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected to backend');
      set({ wsConnected: true, wsError: null });
      if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        handleWSMessage(msg, set, get);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      set({ wsConnected: false, wsError: 'WebSocket connection error' });
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, will reconnect in 3s');
      set({ wsConnected: false });
      if (!wsReconnectTimer) {
        wsReconnectTimer = setTimeout(() => createWSConnection(set, get), 3000);
      }
    };
  } catch (e) {
    console.error('[WS] Failed to create connection:', e);
    set({ wsConnected: false, wsError: String(e) });
    if (!wsReconnectTimer) {
      wsReconnectTimer = setTimeout(() => createWSConnection(set, get), 3000);
    }
  }
}

function handleWSMessage(msg: WSMessage, set: any, get: any) {
  const state = get();

  switch (msg.type) {
    case 'simulation:created': {
      const newSim = msg.payload.simulation as SimulationTask;
      set({ simulations: [newSim, ...state.simulations] });
      break;
    }
    case 'simulation:status': {
      const { simulationId, status, simulation } = msg.payload;
      set({
        simulations: state.simulations.map((s: SimulationTask) =>
          s.id === simulationId
            ? simulation || { ...s, status }
            : s
        ),
        currentSimulation:
          state.currentSimulation && state.currentSimulation.id === simulationId
            ? simulation || { ...state.currentSimulation, status }
            : state.currentSimulation,
      });
      break;
    }
    case 'simulation:progress': {
      const { simulationId, progress, currentStep, elapsedTime, simulation } = msg.payload;
      set({
        simulations: state.simulations.map((s: SimulationTask) =>
          s.id === simulationId
            ? simulation || { ...s, progress, currentStep, elapsedTime }
            : s
        ),
        currentSimulation:
          state.currentSimulation && state.currentSimulation.id === simulationId
            ? simulation || { ...state.currentSimulation, progress, currentStep, elapsedTime }
            : state.currentSimulation,
      });
      break;
    }
    case 'simulation:monitoring': {
      const { simulationId, data } = msg.payload as { simulationId: string; data: MonitoringData };
      set({
        simulations: state.simulations.map((s: SimulationTask) =>
          s.id === simulationId
            ? { ...s, monitoringHistory: [...s.monitoringHistory.slice(-200), data] }
            : s
        ),
        currentSimulation:
          state.currentSimulation && state.currentSimulation.id === simulationId
            ? {
                ...state.currentSimulation,
                monitoringHistory: [...state.currentSimulation.monitoringHistory.slice(-200), data],
              }
            : state.currentSimulation,
      });
      break;
    }
    case 'simulation:warning': {
      const { simulationId, warning } = msg.payload;
      set({
        simulations: state.simulations.map((s: SimulationTask) =>
          s.id === simulationId
            ? { ...s, warnings: [warning, ...s.warnings] }
            : s
        ),
        currentSimulation:
          state.currentSimulation && state.currentSimulation.id === simulationId
            ? { ...state.currentSimulation, warnings: [warning, ...state.currentSimulation.warnings] }
            : state.currentSimulation,
      });
      break;
    }
    case 'simulation:approval': {
      const { simulationId, simulation } = msg.payload;
      if (simulation) {
        set({
          simulations: state.simulations.map((s: SimulationTask) =>
            s.id === simulationId ? simulation : s
          ),
          currentSimulation:
            state.currentSimulation && state.currentSimulation.id === simulationId
              ? simulation
              : state.currentSimulation,
        });
      }
      break;
    }
    case 'series:updated': {
      set({ series: msg.payload.series });
      break;
    }
    case 'stats:updated': {
      break;
    }
  }
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulations: [],
  series: [],
  recommendations: [],
  dailyStats: [],
  currentSimulation: null,
  statusFilter: 'all',
  wsConnected: false,
  wsError: null,

  setStatusFilter: (f) => set({ statusFilter: f }),
  setCurrentSimulation: (id) =>
    set({ currentSimulation: id ? get().simulations.find((s) => s.id === id) || null : null }),

  fetchInitialData: async () => {
    try {
      const [simsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/simulations`),
        fetch(`${API_BASE}/simulations/stats`),
      ]);
      if (simsRes.ok) {
        const simsJson = await simsRes.json();
        set({ simulations: simsJson.data });
      }
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        set({
          series: statsJson.data.series || generateParameterSeries(),
          recommendations: statsJson.data.recommendations || generateRecommendations(4),
          dailyStats: statsJson.data.dailyStats || generateDailyStatistics(14),
        });
      }
      try {
        const seriesRes = await fetch(`${API_BASE}/simulations/series`);
        if (seriesRes.ok) {
          const s = await seriesRes.json();
          set({ series: s.data });
        }
        const recRes = await fetch(`${API_BASE}/simulations/recommendations`);
        if (recRes.ok) {
          const r = await recRes.json();
          set({ recommendations: r.data });
        }
      } catch {}
    } catch (e) {
      console.error('[Store] Failed to fetch initial data, using fallback:', e);
      set({
        simulations: generateMockSimulations(12),
        series: generateParameterSeries(),
        recommendations: generateRecommendations(4),
        dailyStats: generateDailyStatistics(14),
      });
    }
  },

  connectWebSocket: () => {
    createWSConnection(set, get);
  },

  disconnectWebSocket: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = null;
    }
  },

  createSimulation: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, createdBy: '当前用户' }),
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error };
      }
      return { success: true, simulation: json.data };
    } catch (e) {
      console.error('[Store] Create simulation error:', e);
      return { success: false, error: 'Failed to create simulation: ' + (e as Error).message };
    }
  },

  updateSimulationStatus: async (id, status) => {
    try {
      await fetch(`${API_BASE}/simulations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error('[Store] Update status error:', e);
    }
  },

  reviewWarning: async (simId, warningId, reviewedBy, comment, approved) => {
    try {
      await fetch(`${API_BASE}/simulations/${simId}/warnings/${warningId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy, comment, approved }),
      });
      const state = get();
      set({
        simulations: state.simulations.map((s) =>
          s.id === simId
            ? {
                ...s,
                warnings: s.warnings.map((w) =>
                  w.id === warningId ? { ...w, reviewed: true, reviewedBy, reviewComment: comment } : w
                ),
              }
            : s
        ),
      });
    } catch (e) {
      console.error('[Store] Review warning error:', e);
    }
  },

  addAdjustmentLog: (id, log) => {
    const state = get();
    set({
      simulations: state.simulations.map((s) =>
        s.id === id ? { ...s, adjustmentLog: [log, ...s.adjustmentLog] } : s
      ),
    });
  },

  addApproval: async (id, record) => {
    try {
      await fetch(`${API_BASE}/simulations/${id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error('[Store] Add approval error:', e);
    }
  },

  setApprovalStatus: async (id, status) => {
    try {
      await fetch(`${API_BASE}/simulations/${id}/approval-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error('[Store] Set approval status error:', e);
    }
  },

  pushToObservationProposal: async (id, pushedBy) => {
    try {
      const res = await fetch(`${API_BASE}/observations/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: id, pushedBy }),
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error };
      }
      return { success: true };
    } catch (e) {
      console.error('[Store] Push proposal error:', e);
      return { success: false, error: (e as Error).message };
    }
  },

  pauseSeries: async (seriesId) => {
    try {
      await fetch(`${API_BASE}/simulations/series/${seriesId}/pause`, { method: 'POST' });
    } catch (e) {
      console.error('[Store] Pause series error:', e);
    }
  },

  resumeSeries: async (seriesId) => {
    try {
      await fetch(`${API_BASE}/simulations/series/${seriesId}/resume`, { method: 'POST' });
    } catch (e) {
      console.error('[Store] Resume series error:', e);
    }
  },

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
    const { simulations } = get();
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

  generateReportPDF: async (simId) => {
    try {
      const res = await fetch(`${API_BASE}/exports/report/${simId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Report generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disp = res.headers.get('Content-Disposition');
      const fname = disp?.match(/filename="(.+)"/)?.[1] || `GRMHD_Report_${simId}.pdf`;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[Store] PDF generation error:', e);
      throw e;
    }
  },
}));
