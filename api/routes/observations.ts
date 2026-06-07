import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/store.js';
import { generateId } from '../data/mockEngine.js';
import { wsService } from '../services/ws.js';
import type { ObservationProposalLog } from '../types.js';

const router = Router();

router.post('/propose', (req: Request, res: Response) => {
  const {
    simulationId,
    targetSource,
    observingBand,
    exposureTime,
    pushedBy,
  } = req.body as {
    simulationId: string;
    targetSource?: string;
    observingBand?: string;
    exposureTime?: number;
    pushedBy?: string;
  };

  if (!simulationId) {
    res.status(400).json({ success: false, error: 'simulationId is required' });
    return;
  }

  const sim = dataStore.getSimulationById(simulationId);
  if (!sim) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }

  if (sim.approvalStatus !== 'professor_approved') {
    res.status(400).json({
      success: false,
      error: 'Simulation must be professor approved before pushing to observation proposal',
    });
    return;
  }

  const targets = ['M87*', 'Sgr A*', 'NGC 1068', 'Cygnus A', '3C 273', 'NGC 4151'];
  const bands = ['1.3 mm', '2.0 mm', '3.5 mm', '7 mm', '1.2 GHz', '5 GHz', 'X-ray 2-10 keV'];
  const proposal: ObservationProposalLog = {
    id: generateId(),
    simulationId,
    simulationName: sim.name,
    pushedBy: pushedBy || 'Current User',
    pushedAt: Date.now(),
    targetSource: targetSource || targets[Math.floor(Math.random() * targets.length)],
    observingBand: observingBand || bands[Math.floor(Math.random() * bands.length)],
    exposureTime: exposureTime || Math.floor(Math.random() * 50 + 10),
    status: 'submitted',
  };

  dataStore.setObservationProposal(simulationId, proposal);
  dataStore.setApprovalStatus(simulationId, 'pushed_to_proposal');

  const updated = dataStore.getSimulationById(simulationId);

  wsService.broadcast('simulation:approval', {
    simulationId,
    approvalStatus: 'pushed_to_proposal',
    observationProposal: proposal,
    simulation: updated,
  });
  wsService.broadcast('stats:updated', { statistics: dataStore.getStatistics() });

  console.log(`[Observations] Proposal submitted for sim ${simulationId.slice(0, 8)} → ${proposal.targetSource}`);

  res.status(201).json({
    success: true,
    message: 'Observation proposal submitted successfully',
    data: proposal,
  });
});

router.get('/list', (req: Request, res: Response) => {
  const sims = dataStore.getSimulations().filter((s) => s.observationProposal);
  const proposals = sims.map((s) => s.observationProposal!);
  res.json({ success: true, data: proposals });
});

export default router;
