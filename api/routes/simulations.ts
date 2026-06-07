import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/store.js';
import { scheduler } from '../services/scheduler.js';
import { wsService } from '../services/ws.js';
import { generateId } from '../data/mockEngine.js';
import type {
  BlackHoleParams,
  MagneticFieldConfig,
  InitialConditions,
  WarningEvent,
  AdjustmentLog,
  ApprovalRecord,
  ApprovalStatus,
  SimulationStatus,
} from '../types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let sims = dataStore.getSimulations();
  if (status && status !== 'all') {
    sims = sims.filter((s) => s.status === status);
  }
  res.json({ success: true, data: sims });
});

router.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      statistics: dataStore.getStatistics(),
      warnings: dataStore.getWarnings(true),
      dailyStats: dataStore.getDailyStats(),
    },
  });
});

router.get('/series', (req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getSeries() });
});

router.get('/recommendations', (req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getRecommendations() });
});

router.get('/:id', (req: Request, res: Response) => {
  const sim = dataStore.getSimulationById(req.params.id);
  if (!sim) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }
  res.json({ success: true, data: sim });
});

router.post('/', (req: Request, res: Response) => {
  const {
    name,
    params,
    magneticField,
    initialConditions,
    description,
    parameterSeriesId,
    createdBy,
  } = req.body as {
    name: string;
    params: BlackHoleParams;
    magneticField: MagneticFieldConfig;
    initialConditions: InitialConditions;
    description?: string;
    parameterSeriesId?: string;
    createdBy?: string;
  };

  if (!name || !params || !magneticField || !initialConditions) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const result = dataStore.createSimulation({
    name,
    params,
    magneticField,
    initialConditions,
    description,
    parameterSeriesId,
    createdBy,
  });

  if (!result.success || !result.simulation) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  scheduler.startSimulation(result.simulation.id);

  wsService.broadcast('simulation:created', {
    simulation: result.simulation,
  });
  wsService.broadcast('series:updated', {
    series: dataStore.getSeries(),
  });
  wsService.broadcast('stats:updated', {
    statistics: dataStore.getStatistics(),
  });

  res.status(201).json({ success: true, data: result.simulation });
});

router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body as { status: SimulationStatus };
  const sim = dataStore.updateSimulationStatus(req.params.id, status);
  if (!sim) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }
  wsService.broadcast('simulation:status', {
    simulationId: req.params.id,
    status,
    simulation: sim,
  });
  wsService.broadcast('stats:updated', {
    statistics: dataStore.getStatistics(),
  });
  if (sim.parameterSeriesId) {
    wsService.broadcast('series:updated', {
      series: dataStore.getSeries(),
    });
  }
  res.json({ success: true, data: sim });
});

router.post('/:id/warnings/:warningId/review', (req: Request, res: Response) => {
  const { reviewedBy, comment, approved } = req.body as {
    reviewedBy: string;
    comment: string;
    approved: boolean;
  };
  const { id, warningId } = req.params;

  dataStore.reviewWarning(id, warningId, reviewedBy, comment);

  if (approved) {
    const sim = dataStore.getSimulationById(id);
    if (sim) {
      const log: AdjustmentLog = {
        id: generateId(),
        simulationId: id,
        timestamp: Date.now(),
        adjustedParams: { perturbation: sim.initialConditions.perturbation * 1.2 },
        reason: comment || 'Based on review, adjusted initial perturbation',
        reviewedBy,
      };
      dataStore.addAdjustmentLog(id, log);
    }
  }

  const updated = dataStore.getSimulationById(id);
  wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });
  res.json({ success: true, data: updated });
});

router.post('/:id/approvals', (req: Request, res: Response) => {
  const record = req.body as ApprovalRecord;
  dataStore.addApproval(req.params.id, record);
  const updated = dataStore.getSimulationById(req.params.id);
  wsService.broadcast('simulation:approval', {
    simulationId: req.params.id,
    approval: record,
    simulation: updated,
  });
  res.json({ success: true, data: updated });
});

router.patch('/:id/approval-status', (req: Request, res: Response) => {
  const { status } = req.body as { status: ApprovalStatus };
  const updated = dataStore.setApprovalStatus(req.params.id, status);
  if (!updated) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }
  wsService.broadcast('simulation:approval', {
    simulationId: req.params.id,
    approvalStatus: status,
    simulation: updated,
  });
  wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });
  res.json({ success: true, data: updated });
});

router.post('/series/:id/pause', (req: Request, res: Response) => {
  dataStore.pauseSeries(req.params.id);
  wsService.broadcast('series:updated', { series: dataStore.getSeries() });
  res.json({ success: true, data: dataStore.getSeries() });
});

router.post('/series/:id/resume', (req: Request, res: Response) => {
  dataStore.resumeSeries(req.params.id);
  wsService.broadcast('series:updated', { series: dataStore.getSeries() });
  res.json({ success: true, data: dataStore.getSeries() });
});

export default router;
