import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/store.js';
import { generateSimulationReportPDF } from '../services/pdfGenerator.js';

const router = Router();

router.post('/report/:simId', async (req: Request, res: Response) => {
  try {
    const sim = dataStore.getSimulationById(req.params.simId);
    if (!sim) {
      res.status(404).json({ success: false, error: 'Simulation not found' });
      return;
    }

    const pdfBuffer = await generateSimulationReportPDF(sim);
    const filename = `GRMHD_Report_${sim.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const buf = Buffer.from(pdfBuffer);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (error) {
    console.error('[PDF] Generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF report' });
  }
});

router.get('/data/:simId', (req: Request, res: Response) => {
  const sim = dataStore.getSimulationById(req.params.simId);
  if (!sim) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }

  const { format, spinRange, fluxRange, timeWindow } = req.query;
  const fmt = format || 'json';

  let data = {
    simulation: {
      id: sim.id,
      name: sim.name,
      params: sim.params,
      magneticField: sim.magneticField,
      initialConditions: sim.initialConditions,
      status: sim.status,
      progress: sim.progress,
    },
    plasma: sim.monitoringHistory.map((m) => ({
      timeStep: m.timeStep,
      density: m.density,
      temperature: m.temperature,
      magneticFieldStrength: m.magneticFieldStrength,
      accretionRate: m.accretionRate,
    })),
    radiation: sim.radiationData || null,
    magneticField3D: sim.magneticField3D || null,
  };

  if (fmt === 'csv') {
    let csv = 'timeStep,density,temperature,magneticField,accretionRate\n';
    data.plasma.forEach((p) => {
      csv += `${p.timeStep},${p.density[0]},${p.temperature[0]},${p.magneticFieldStrength[0]},${p.accretionRate}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sim_${sim.id}_data.csv"`);
    res.send(csv);
    return;
  }

  res.json({ success: true, data });
});

export default router;
