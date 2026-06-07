export interface BlackHoleParams {
  mass: number;
  spin: number;
  inclination: number;
  accretionRate: number;
}

export interface MagneticFieldConfig {
  strength: number;
  topology: 'toroidal' | 'poloidal' | 'helical';
  fluxDistribution: 'uniform' | 'gaussian' | 'power-law';
  fluxExponent: number;
}

export interface InitialConditions {
  densityProfile: 'isothermal' | 'adiabatic' | 'power-law';
  temperature: number;
  angularVelocity: 'keplerian' | 'sub-keplerian' | 'super-keplerian';
  perturbation: number;
}

export type SimulationStatus =
  | 'pending_validation'
  | 'mesh_generation'
  | 'initializing'
  | 'evolving'
  | 'radiation_synthesis'
  | 'completed'
  | 'error_fallback'
  | 'paused';

export type WarningType = 'accretion_drop' | 'magnetic_anomaly' | 'divergence' | 'mri_anomaly';
export type WarningLevel = 'info' | 'warning' | 'critical';

export interface WarningEvent {
  id: string;
  simulationId: string;
  type: WarningType;
  level: WarningLevel;
  timestamp: number;
  description: string;
  threshold: number;
  actualValue: number;
  reviewed: boolean;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface AdjustmentLog {
  id: string;
  simulationId: string;
  timestamp: number;
  adjustedParams: Partial<BlackHoleParams & MagneticFieldConfig & InitialConditions>;
  reason: string;
  reviewedBy: string;
}

export interface MonitoringData {
  simulationId: string;
  timestamp: number;
  timeStep: number;
  mriGrowthRate: number;
  jetPower: number;
  jetCollimation: number;
  accretionRate: number;
  magneticFieldStrength: number[];
  temperature: number[];
  density: number[];
}

export interface RadiationData {
  simulationId: string;
  spectrum: { frequency: number[]; flux: number[] };
  sed: { energy: number[]; luminosity: number[] };
  lightCurve: { time: number[]; flux: number[][]; bands: string[] };
}

export interface MagneticField3D {
  fieldLines: { start: [number, number, number]; end: [number, number, number]; strength: number }[];
  densityField: number[];
  gridDimensions: [number, number, number];
}

export type ApprovalType = 'postdoc_validation' | 'professor_confirmation';

export interface ApprovalRecord {
  id: string;
  simulationId: string;
  type: ApprovalType;
  approver: string;
  decision: 'approved' | 'rejected';
  comment: string;
  numericalStability?: {
    convergenceRate: number;
    energyConservation: number;
    divergence: boolean;
  };
  physicalValidity?: {
    jetStability: number;
    mriSaturation: boolean;
    comparisonWithObservations: string;
  };
  timestamp: number;
}

export type ApprovalStatus = 'pending' | 'postdoc_approved' | 'professor_approved' | 'rejected' | 'pushed_to_proposal';

export interface ParameterSeries {
  id: string;
  name: string;
  baseParams: BlackHoleParams;
  variableParams: (keyof BlackHoleParams | keyof MagneticFieldConfig)[];
  simulations: string[];
  status: 'active' | 'paused' | 'completed';
  consecutiveDivergences: number;
}

export interface Recommendation {
  id: string;
  params: BlackHoleParams;
  magneticField: MagneticFieldConfig;
  initialConditions: InitialConditions;
  jetStabilityProbability: number;
  confidence: number;
  similarHistoricalSimulations: string[];
  expectedJetPower: number;
}

export interface DailyStatistics {
  date: string;
  totalSimulations: number;
  completedSimulations: number;
  completionRate: number;
  averageDuration: number;
  averageJetPowerDeviation: number;
  warningsCount: number;
  divergenceCount: number;
}

export interface ObservationProposalLog {
  id: string;
  simulationId: string;
  simulationName: string;
  pushedBy: string;
  pushedAt: number;
  targetSource: string;
  observingBand: string;
  exposureTime: number;
  status: 'submitted' | 'accepted' | 'rejected';
}

export interface SimulationTask {
  id: string;
  name: string;
  params: BlackHoleParams;
  magneticField: MagneticFieldConfig;
  initialConditions: InitialConditions;
  status: SimulationStatus;
  progress: number;
  currentStep: number;
  totalSteps: number;
  startTime: number;
  endTime?: number;
  elapsedTime: number;
  parameterSeriesId?: string;
  warnings: WarningEvent[];
  adjustmentLog: AdjustmentLog[];
  divergenceCount: number;
  approvalStatus: ApprovalStatus;
  approvals: ApprovalRecord[];
  monitoringHistory: MonitoringData[];
  radiationData?: RadiationData;
  magneticField3D?: MagneticField3D;
  createdBy: string;
  description?: string;
  observationProposal?: ObservationProposalLog;
}

export type WSMessageType =
  | 'simulation:status'
  | 'simulation:progress'
  | 'simulation:monitoring'
  | 'simulation:warning'
  | 'simulation:approval'
  | 'simulation:created'
  | 'series:updated'
  | 'stats:updated';

export interface WSMessage {
  type: WSMessageType;
  timestamp: number;
  payload: any;
}

export const STATUS_LABELS: Record<SimulationStatus, string> = {
  pending_validation: '待校验',
  mesh_generation: '网格生成',
  initializing: '初始化',
  evolving: '演化计算',
  radiation_synthesis: '辐射合成',
  completed: '完成',
  error_fallback: '异常回退',
  paused: '已暂停',
};

export const STATUS_COLORS: Record<SimulationStatus, string> = {
  pending_validation: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  mesh_generation: 'bg-magnetic-500/20 text-magnetic-200 border-magnetic-500/30',
  initializing: 'bg-plasma-500/20 text-plasma-200 border-plasma-500/30',
  evolving: 'bg-jet-500/20 text-jet-200 border-jet-500/30',
  radiation_synthesis: 'bg-accretion-500/20 text-accretion-200 border-accretion-500/30',
  completed: 'bg-gravity-500/20 text-gravity-200 border-gravity-500/30',
  error_fallback: 'bg-alert-500/20 text-alert-200 border-alert-500/30',
  paused: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
};

export const WARNING_LABELS: Record<WarningType, string> = {
  accretion_drop: '吸积率突降',
  magnetic_anomaly: '磁场异常',
  divergence: '数值发散',
  mri_anomaly: 'MRI异常',
};

export const TOPOLOGY_LABELS: Record<MagneticFieldConfig['topology'], string> = {
  toroidal: '环形',
  poloidal: '极向',
  helical: '螺旋',
};

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: '待审批',
  postdoc_approved: '博士后已通过',
  professor_approved: '教授已确认',
  rejected: '已驳回',
  pushed_to_proposal: '已推送至提案',
};
