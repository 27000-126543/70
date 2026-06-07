import { create } from 'zustand';
import type { BlackHoleParams, MagneticFieldConfig, InitialConditions } from '../types';

interface ParamState {
  blackHole: BlackHoleParams;
  magneticField: MagneticFieldConfig;
  initialConditions: InitialConditions;
  taskName: string;
  taskDescription: string;
  selectedSeriesId: string | null;

  setBlackHole: (p: Partial<BlackHoleParams>) => void;
  setMagneticField: (p: Partial<MagneticFieldConfig>) => void;
  setInitialConditions: (p: Partial<InitialConditions>) => void;
  setTaskName: (n: string) => void;
  setTaskDescription: (d: string) => void;
  setSelectedSeries: (id: string | null) => void;
  applyRecommendation: (r: {
    params: BlackHoleParams;
    magneticField: MagneticFieldConfig;
    initialConditions: InitialConditions;
  }) => void;
  reset: () => void;
}

const defaultBH: BlackHoleParams = {
  mass: 1e8,
  spin: 0.8,
  inclination: 45,
  accretionRate: 0.1,
};

const defaultMF: MagneticFieldConfig = {
  strength: 1.0,
  topology: 'helical',
  fluxDistribution: 'power-law',
  fluxExponent: -1.0,
};

const defaultIC: InitialConditions = {
  densityProfile: 'power-law',
  temperature: 1.0,
  angularVelocity: 'keplerian',
  perturbation: 0.01,
};

export const useParamStore = create<ParamState>((set) => ({
  blackHole: defaultBH,
  magneticField: defaultMF,
  initialConditions: defaultIC,
  taskName: '',
  taskDescription: '',
  selectedSeriesId: null,

  setBlackHole: (p) => set((s) => ({ blackHole: { ...s.blackHole, ...p } })),
  setMagneticField: (p) => set((s) => ({ magneticField: { ...s.magneticField, ...p } })),
  setInitialConditions: (p) => set((s) => ({ initialConditions: { ...s.initialConditions, ...p } })),
  setTaskName: (n) => set({ taskName: n }),
  setTaskDescription: (d) => set({ taskDescription: d }),
  setSelectedSeries: (id) => set({ selectedSeriesId: id }),

  applyRecommendation: (r) =>
    set({
      blackHole: { ...r.params },
      magneticField: { ...r.magneticField },
      initialConditions: { ...r.initialConditions },
    }),

  reset: () =>
    set({
      blackHole: defaultBH,
      magneticField: defaultMF,
      initialConditions: defaultIC,
      taskName: '',
      taskDescription: '',
      selectedSeriesId: null,
    }),
}));
