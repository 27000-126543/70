import type {
  SimulationTask,
  BlackHoleParams,
  MagneticFieldConfig,
  InitialConditions,
  MonitoringData,
  RadiationData,
  MagneticField3D,
  WarningEvent,
  ApprovalRecord,
  ParameterSeries,
  Recommendation,
  DailyStatistics,
} from '../types.js';

const uid = () => Math.random().toString(36).slice(2, 10);

export function generateId(): string {
  return uid();
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateBlackHoleParams(overrides?: Partial<BlackHoleParams>): BlackHoleParams {
  return {
    mass: Math.pow(10, randomInRange(6, 9)),
    spin: randomInRange(0.3, 0.95),
    inclination: randomInRange(10, 80),
    accretionRate: randomInRange(0.01, 0.5),
    ...overrides,
  };
}

export function generateMagneticFieldConfig(overrides?: Partial<MagneticFieldConfig>): MagneticFieldConfig {
  const topologies: MagneticFieldConfig['topology'][] = ['toroidal', 'poloidal', 'helical'];
  const distributions: MagneticFieldConfig['fluxDistribution'][] = ['uniform', 'gaussian', 'power-law'];
  return {
    strength: randomInRange(0.1, 10),
    topology: topologies[Math.floor(Math.random() * topologies.length)],
    fluxDistribution: distributions[Math.floor(Math.random() * distributions.length)],
    fluxExponent: randomInRange(-1.5, 0.5),
    ...overrides,
  };
}

export function generateInitialConditions(overrides?: Partial<InitialConditions>): InitialConditions {
  const densityProfiles: InitialConditions['densityProfile'][] = ['isothermal', 'adiabatic', 'power-law'];
  const angularVelocities: InitialConditions['angularVelocity'][] = ['keplerian', 'sub-keplerian', 'super-keplerian'];
  return {
    densityProfile: densityProfiles[Math.floor(Math.random() * densityProfiles.length)],
    temperature: randomInRange(0.5, 5),
    angularVelocity: angularVelocities[Math.floor(Math.random() * angularVelocities.length)],
    perturbation: randomInRange(0.005, 0.05),
    ...overrides,
  };
}

export function generateMonitoringData(simId: string, step: number): MonitoringData {
  return {
    simulationId: simId,
    timestamp: Date.now(),
    timeStep: step,
    mriGrowthRate: 0.5 + Math.sin(step * 0.1) * 0.2 + randomInRange(-0.1, 0.1),
    jetPower: Math.pow(10, 43 + randomInRange(0, 2)) * (1 + Math.sin(step * 0.05) * 0.3),
    jetCollimation: 0.6 + randomInRange(-0.1, 0.2),
    accretionRate: 0.1 + Math.sin(step * 0.08) * 0.05 + randomInRange(-0.02, 0.02),
    magneticFieldStrength: Array.from({ length: 10 }, () => randomInRange(0.5, 5)),
    temperature: Array.from({ length: 10 }, () => randomInRange(0.5, 10)),
    density: Array.from({ length: 10 }, (_, i) => Math.exp(-i * 0.3) * randomInRange(0.8, 1.2)),
  };
}

export function generateRadiationData(simId: string): RadiationData {
  const freqCount = 100;
  const frequencies = Array.from({ length: freqCount }, (_, i) => Math.pow(10, 8 + i * 0.12));
  const flux = frequencies.map((f) => {
    const logF = Math.log10(f);
    return Math.pow(10, -10 - Math.pow(logF - 14, 2) / 20 + randomInRange(-0.2, 0.2));
  });
  const energies = Array.from({ length: 60 }, (_, i) => Math.pow(10, -3 + i * 0.1));
  const luminosities = energies.map((e) => {
    const logE = Math.log10(e);
    return Math.pow(10, 40 - Math.pow(logE - 1, 2) / 10 + randomInRange(-0.15, 0.15));
  });
  const timeCount = 200;
  const times = Array.from({ length: timeCount }, (_, i) => i * 100);
  const bands = ['Radio', 'Optical', 'X-ray', 'Gamma'];
  const lightFlux = bands.map(() =>
    times.map((t) => 1 + Math.sin(t * 0.01) * 0.3 + randomInRange(-0.1, 0.1) + Math.exp(-Math.pow((t - 5000) / 1000, 2)) * 0.5)
  );
  return {
    simulationId: simId,
    spectrum: { frequency: frequencies, flux },
    sed: { energy: energies, luminosity: luminosities },
    lightCurve: { time: times, flux: lightFlux, bands },
  };
}

export function generateMagneticField3D(): MagneticField3D {
  const lines: { start: [number, number, number]; end: [number, number, number]; strength: number }[] = [];
  const N = 60;
  for (let i = 0; i < N; i++) {
    const phi = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 3;
    const theta = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    const start: [number, number, number] = [
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      (Math.random() - 0.5) * 2,
    ];
    const dphi = phi + (Math.random() - 0.5) * 0.5;
    const dr = r * (1 + 0.2 + Math.random() * 0.3);
    const end: [number, number, number] = [
      dr * Math.sin(theta) * Math.cos(dphi),
      dr * Math.sin(theta) * Math.sin(dphi),
      start[2] + (Math.random() - 0.5) * 1,
    ];
    lines.push({ start, end, strength: 1 / r + Math.random() * 0.5 });
  }
  const dims: [number, number, number] = [20, 20, 20];
  const densityField: number[] = [];
  for (let z = 0; z < dims[2]; z++) {
    for (let y = 0; y < dims[1]; y++) {
      for (let x = 0; x < dims[0]; x++) {
        const dx = x - dims[0] / 2;
        const dy = y - dims[1] / 2;
        const dz = z - dims[2] / 2;
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const h = Math.abs(dz);
        densityField.push(Math.exp(-r * 0.3 - h * 0.8) + randomInRange(0, 0.05));
      }
    }
  }
  return { fieldLines: lines, densityField, gridDimensions: dims };
}

export function generateWarningEvent(simId: string): WarningEvent {
  const types: WarningEvent['type'][] = ['accretion_drop', 'magnetic_anomaly', 'divergence', 'mri_anomaly'];
  const levels: WarningEvent['level'][] = ['info', 'warning', 'critical'];
  const type = types[Math.floor(Math.random() * types.length)];
  const level = levels[Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 1 : 0];
  const descriptions: Record<WarningEvent['type'], string> = {
    accretion_drop: '检测到吸积率突降超过50%阈值',
    magnetic_anomaly: '磁场强度出现非物理波动',
    divergence: '数值计算出现发散趋势',
    mri_anomaly: 'MRI增长率偏离理论预期',
  };
  return {
    id: generateId(),
    simulationId: simId,
    type,
    level,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000),
    description: descriptions[type],
    threshold: 0.5,
    actualValue: 0.23 + Math.random() * 0.2,
    reviewed: Math.random() > 0.6,
    reviewedBy: Math.random() > 0.6 ? '李研究员' : undefined,
    reviewComment: Math.random() > 0.6 ? '已复核，建议调整磁场构型' : undefined,
  };
}

const SCIENTISTS = ['王教授', '李博士后', '张研究员', '赵首席科学家', '陈博士'];

export function generateApprovalRecord(simId: string, type: ApprovalRecord['type']): ApprovalRecord {
  const approved = Math.random() > 0.2;
  return {
    id: generateId(),
    simulationId: simId,
    type,
    approver: SCIENTISTS[Math.floor(Math.random() * SCIENTISTS.length)],
    decision: approved ? 'approved' : 'rejected',
    comment: approved
      ? type === 'postdoc_validation'
        ? '数值收敛良好，能量守恒误差在可接受范围内'
        : '物理图像合理，喷流准直度与理论预期一致'
      : type === 'postdoc_validation'
      ? '发现数值发散趋势，建议调整CFL条件'
      : '喷流不稳定，需要重新审视磁场初始条件',
    numericalStability:
      type === 'postdoc_validation'
        ? {
            convergenceRate: randomInRange(1.8, 2.2),
            energyConservation: randomInRange(0.99, 1.01),
            divergence: !approved,
          }
        : undefined,
    physicalValidity:
      type === 'professor_confirmation'
        ? {
            jetStability: randomInRange(0.6, 0.95),
            mriSaturation: true,
            comparisonWithObservations: '与M87*观测特征基本一致',
          }
        : undefined,
    timestamp: Date.now() - Math.floor(Math.random() * 86400000),
  };
}

const SIM_NAMES = [
  'M87-like高自旋模拟',
  'Sgr A*低自旋基准',
  '螺旋磁场喷流研究',
  '极向磁场MRI分析',
  '高吸积率辐射主导',
  '亚爱丁顿吸积稳态',
  '黑洞自旋-喷流耦合',
  '磁重联事件模拟',
  '倾角效应对比研究',
  '扰动演化模式分析',
  '环形磁场稳定性',
  '高能辐射区定位',
];

export function generateMockSimulations(count: number): SimulationTask[] {
  const statuses: SimulationTask['status'][] = [
    'pending_validation',
    'mesh_generation',
    'initializing',
    'evolving',
    'radiation_synthesis',
    'completed',
    'error_fallback',
  ];
  const approvals: SimulationTask['approvalStatus'][] = [
    'pending',
    'postdoc_approved',
    'professor_approved',
    'rejected',
  ];
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length];
    const isCompleted = status === 'completed';
    const totalSteps = 5000;
    const progress =
      status === 'completed' ? 100 : status === 'pending_validation' ? 0 : Math.floor(randomInRange(5, 95));
    const currentStep = Math.floor((progress / 100) * totalSteps);
    const simId = generateId();
    const warnings = Math.random() > 0.4 ? Array.from({ length: Math.floor(randomInRange(1, 4)) }, () => generateWarningEvent(simId)) : [];
    const approvalStatus = isCompleted ? approvals[Math.floor(Math.random() * approvals.length)] : 'pending';
    const approvalsList: ApprovalRecord[] = [];
    if (approvalStatus === 'postdoc_approved' || approvalStatus === 'professor_approved' || approvalStatus === 'rejected') {
      approvalsList.push(generateApprovalRecord(simId, 'postdoc_validation'));
    }
    if (approvalStatus === 'professor_approved') {
      approvalsList.push(generateApprovalRecord(simId, 'professor_confirmation'));
    }
    const histLen = isCompleted ? 100 : Math.floor(progress);
    const monitoringHistory = Array.from({ length: histLen }, (_, s) => generateMonitoringData(simId, s));
    return {
      id: simId,
      name: SIM_NAMES[i % SIM_NAMES.length] + (i >= SIM_NAMES.length ? ` #${Math.floor(i / SIM_NAMES.length) + 1}` : ''),
      params: generateBlackHoleParams(),
      magneticField: generateMagneticFieldConfig(),
      initialConditions: generateInitialConditions(),
      status,
      progress,
      currentStep,
      totalSteps,
      startTime: Date.now() - Math.floor(randomInRange(3600000, 86400000 * 3)),
      endTime: isCompleted ? Date.now() - Math.floor(randomInRange(0, 86400000)) : undefined,
      elapsedTime: isCompleted
        ? Math.floor(randomInRange(1800, 72000))
        : Math.floor(((Date.now() - (Date.now() - Math.floor(randomInRange(3600000, 86400000 * 3)))) / 1000) * (progress / 100)),
      warnings,
      adjustmentLog:
        warnings.length > 0
          ? [
              {
                id: generateId(),
                simulationId: simId,
                timestamp: Date.now() - 3600000,
                adjustedParams: { perturbation: 0.02 },
                reason: '调整初始扰动幅度以抑制发散',
                reviewedBy: '李研究员',
              },
            ]
          : [],
      divergenceCount: Math.floor(randomInRange(0, 3)),
      approvalStatus,
      approvals: approvalsList,
      monitoringHistory,
      radiationData: isCompleted ? generateRadiationData(simId) : undefined,
      magneticField3D: isCompleted ? generateMagneticField3D() : undefined,
      createdBy: SCIENTISTS[Math.floor(Math.random() * SCIENTISTS.length)],
      description: '研究黑洞吸积盘的广义相对论磁流体动力学演化及喷流形成机制',
    };
  });
}

export function generateParameterSeries(): ParameterSeries[] {
  return [
    {
      id: generateId(),
      name: '自旋参数扫描系列 a* = 0.1 ~ 0.95',
      baseParams: generateBlackHoleParams({ spin: 0.5 }),
      variableParams: ['spin'],
      simulations: [],
      status: 'active',
      consecutiveDivergences: 0,
    },
    {
      id: generateId(),
      name: '磁场强度梯度系列 B = 0.1 ~ 10 G',
      baseParams: generateBlackHoleParams(),
      variableParams: ['strength'],
      simulations: [],
      status: 'active',
      consecutiveDivergences: 1,
    },
    {
      id: generateId(),
      name: '高吸积率系列（已暂停-连续发散）',
      baseParams: generateBlackHoleParams({ accretionRate: 10 }),
      variableParams: ['accretionRate'],
      simulations: [],
      status: 'paused',
      consecutiveDivergences: 3,
    },
  ];
}

export function generateRecommendations(count = 3): Recommendation[] {
  return Array.from({ length: count }, () => ({
    id: generateId(),
    params: generateBlackHoleParams({ spin: randomInRange(0.7, 0.95) }),
    magneticField: generateMagneticFieldConfig({ topology: 'helical', strength: randomInRange(1, 5) }),
    initialConditions: generateInitialConditions({ perturbation: randomInRange(0.005, 0.02) }),
    jetStabilityProbability: randomInRange(0.75, 0.97),
    confidence: randomInRange(0.8, 0.95),
    similarHistoricalSimulations: [generateId(), generateId()],
    expectedJetPower: Math.pow(10, 44 + randomInRange(0, 0.8)),
  }));
}

export function generateDailyStatistics(days = 14): DailyStatistics[] {
  const result: DailyStatistics[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const total = Math.floor(randomInRange(3, 10));
    const completed = Math.floor(total * randomInRange(0.5, 0.95));
    result.push({
      date: d.toISOString().split('T')[0],
      totalSimulations: total,
      completedSimulations: completed,
      completionRate: completed / total,
      averageDuration: randomInRange(1800, 14400),
      averageJetPowerDeviation: randomInRange(0.05, 0.25),
      warningsCount: Math.floor(randomInRange(0, 8)),
      divergenceCount: Math.floor(randomInRange(0, 2)),
    });
  }
  return result;
}

export function formatScientificNotation(value: number, decimals = 2): string {
  if (value === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  if (exp >= -3 && exp <= 3) return value.toFixed(decimals);
  return `${mantissa.toFixed(decimals)} × 10^${exp}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}时${m}分`;
}
