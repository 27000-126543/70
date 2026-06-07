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
  simName?: string;
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
  createdBy: string;
  description?: string;
  radiationData?: RadiationData;
  magneticField3D?: MagneticField3D;
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
