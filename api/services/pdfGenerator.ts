import { jsPDF } from 'jspdf';
import type { SimulationTask } from '../types.js';
import { formatScientificNotation, formatDuration } from '../data/mockEngine.js';

export async function generateSimulationReportPDF(sim: SimulationTask): Promise<ArrayBuffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  let y = 15;

  function addText(text: string, size: number = 10, style: string = 'normal', color: [number, number, number] = [220, 220, 230]) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function newPageCheck(needed: number) {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  }

  doc.setFillColor(5, 7, 20);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  addText('GRMHD BLACK HOLE SIMULATION REPORT', 18, 'bold', [0, 212, 255]);
  y += 8;
  doc.text(sim.name, marginLeft, y);
  y += 6;
  addText('General Relativistic Magnetohydrodynamics - Jet Feedback Analysis', 9, 'italic', [150, 150, 170]);
  doc.text('General Relativistic Magnetohydrodynamics - Jet Feedback Analysis', marginLeft, y);
  y += 4;
  addText(`Report Generated: ${new Date().toLocaleString()}`, 9, 'normal', [120, 120, 140]);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, marginLeft, y);
  y += 8;

  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - 15, y);
  y += 8;

  addText('SIMULATION OVERVIEW', 12, 'bold', [255, 170, 0]);
  doc.text('SIMULATION OVERVIEW', marginLeft, y);
  y += 7;

  const overviewData = [
    ['Simulation ID', sim.id],
    ['Creator', sim.createdBy],
    ['Status', sim.status],
    ['Progress', `${sim.progress.toFixed(1)}%`],
    ['Total Steps', sim.totalSteps.toLocaleString()],
    ['Current Step', sim.currentStep.toLocaleString()],
    ['Elapsed Time', formatDuration(sim.elapsedTime)],
    ['Warnings', sim.warnings.length.toString()],
  ];

  overviewData.forEach(([k, v]) => {
    newPageCheck(6);
    addText(k, 9, 'bold', [100, 100, 130]);
    doc.text(`${k}:`, marginLeft, y);
    addText(v, 9, 'normal', [220, 220, 230]);
    doc.text(v, marginLeft + 55, y);
    y += 5;
  });

  y += 4;
  doc.setDrawColor(255, 170, 0);
  doc.setLineWidth(0.2);
  doc.line(marginLeft, y, pageWidth - 15, y);
  y += 8;

  addText('BLACK HOLE PARAMETERS', 12, 'bold', [0, 212, 255]);
  doc.text('BLACK HOLE PARAMETERS', marginLeft, y);
  y += 7;

  const bhParams = [
    ['Mass M', `${formatScientificNotation(sim.params.mass, 2)} M☉`],
    ['Spin a*', sim.params.spin.toFixed(4)],
    ['Inclination', `${sim.params.inclination.toFixed(1)}°`],
    ['Accretion Rate', `${sim.params.accretionRate.toFixed(4)} Ṁ_Edd`],
  ];

  bhParams.forEach(([k, v]) => {
    newPageCheck(6);
    addText(k, 9, 'bold', [100, 100, 130]);
    doc.text(`${k}:`, marginLeft, y);
    addText(v, 9, 'normal', [220, 220, 230]);
    doc.text(v, marginLeft + 55, y);
    y += 5;
  });

  y += 4;
  doc.line(marginLeft, y, pageWidth - 15, y);
  y += 8;

  addText('MAGNETIC FIELD CONFIGURATION', 12, 'bold', [168, 85, 247]);
  doc.text('MAGNETIC FIELD CONFIGURATION', marginLeft, y);
  y += 7;

  const mfParams = [
    ['Strength B', `${sim.magneticField.strength.toFixed(3)} × 10⁸ G`],
    ['Topology', sim.magneticField.topology],
    ['Flux Distribution', sim.magneticField.fluxDistribution],
    ['Flux Exponent', sim.magneticField.fluxExponent.toFixed(3)],
  ];

  mfParams.forEach(([k, v]) => {
    newPageCheck(6);
    addText(k, 9, 'bold', [100, 100, 130]);
    doc.text(`${k}:`, marginLeft, y);
    addText(v, 9, 'normal', [220, 220, 230]);
    doc.text(v, marginLeft + 55, y);
    y += 5;
  });

  y += 4;
  doc.line(marginLeft, y, pageWidth - 15, y);
  y += 8;

  addText('INITIAL CONDITIONS', 12, 'bold', [34, 211, 238]);
  doc.text('INITIAL CONDITIONS', marginLeft, y);
  y += 7;

  const icParams = [
    ['Density Profile', sim.initialConditions.densityProfile],
    ['Angular Velocity', sim.initialConditions.angularVelocity],
    ['Temperature', `${sim.initialConditions.temperature.toFixed(3)} × 10¹¹ K`],
    ['Perturbation', sim.initialConditions.perturbation.toFixed(4)],
  ];

  icParams.forEach(([k, v]) => {
    newPageCheck(6);
    addText(k, 9, 'bold', [100, 100, 130]);
    doc.text(`${k}:`, marginLeft, y);
    addText(v, 9, 'normal', [220, 220, 230]);
    doc.text(v, marginLeft + 55, y);
    y += 5;
  });

  if (sim.monitoringHistory.length > 0) {
    y += 4;
    doc.line(marginLeft, y, pageWidth - 15, y);
    y += 8;
    newPageCheck(40);

    addText('MONITORING SUMMARY', 12, 'bold', [16, 185, 129]);
    doc.text('MONITORING SUMMARY', marginLeft, y);
    y += 7;

    const recent = sim.monitoringHistory[sim.monitoringHistory.length - 1];
    const monitorParams = [
      ['MRI Growth Rate', recent.mriGrowthRate.toFixed(4)],
      ['Jet Power', `${formatScientificNotation(recent.jetPower, 2)} erg/s`],
      ['Jet Collimation', recent.jetCollimation.toFixed(3)],
      ['Accretion Rate (inst.)', recent.accretionRate.toFixed(4)],
      ['Data Points', sim.monitoringHistory.length.toString()],
    ];

    monitorParams.forEach(([k, v]) => {
      newPageCheck(6);
      addText(k, 9, 'bold', [100, 100, 130]);
      doc.text(`${k}:`, marginLeft, y);
      addText(v, 9, 'normal', [220, 220, 230]);
      doc.text(v, marginLeft + 55, y);
      y += 5;
    });
  }

  if (sim.warnings.length > 0) {
    y += 4;
    doc.line(marginLeft, y, pageWidth - 15, y);
    y += 8;
    newPageCheck(30);

    addText(`WARNING EVENTS (${sim.warnings.length})`, 12, 'bold', [255, 59, 92]);
    doc.text(`WARNING EVENTS (${sim.warnings.length})`, marginLeft, y);
    y += 7;

    sim.warnings.slice(0, 5).forEach((w, i) => {
      newPageCheck(12);
      addText(`[${w.level.toUpperCase()}] ${w.description}`, 9, 'bold', [255, 100, 120]);
      doc.text(`[${w.level.toUpperCase()}] ${w.description}`, marginLeft, y);
      y += 4;
      addText(`  Threshold: ${w.threshold.toFixed(3)} | Actual: ${w.actualValue.toFixed(3)} | ${new Date(w.timestamp).toLocaleString()}`, 8, 'normal', [180, 180, 200]);
      doc.text(`  Threshold: ${w.threshold.toFixed(3)} | Actual: ${w.actualValue.toFixed(3)} | ${new Date(w.timestamp).toLocaleString()}`, marginLeft, y);
      y += 5;
    });
  }

  if (sim.approvals.length > 0) {
    y += 4;
    doc.line(marginLeft, y, pageWidth - 15, y);
    y += 8;
    newPageCheck(30);

    addText(`APPROVAL RECORDS (${sim.approvals.length})`, 12, 'bold', [16, 185, 129]);
    doc.text(`APPROVAL RECORDS (${sim.approvals.length})`, marginLeft, y);
    y += 7;

    sim.approvals.forEach((a) => {
      newPageCheck(12);
      const label = a.type === 'postdoc_validation' ? 'Postdoc Validation' : 'Professor Confirmation';
      addText(`${label} - ${a.decision.toUpperCase()} by ${a.approver}`, 9, 'bold', a.decision === 'approved' ? [16, 185, 129] : [255, 100, 120]);
      doc.text(`${label} - ${a.decision.toUpperCase()} by ${a.approver}`, marginLeft, y);
      y += 4;
      addText(`  ${a.comment} | ${new Date(a.timestamp).toLocaleString()}`, 8, 'normal', [180, 180, 200]);
      doc.text(`  ${a.comment} | ${new Date(a.timestamp).toLocaleString()}`, marginLeft, y);
      y += 5;
    });
  }

  if (sim.observationProposal) {
    y += 4;
    doc.line(marginLeft, y, pageWidth - 15, y);
    y += 8;
    newPageCheck(20);

    addText('OBSERVATION PROPOSAL', 12, 'bold', [0, 212, 255]);
    doc.text('OBSERVATION PROPOSAL', marginLeft, y);
    y += 7;

    const propParams = [
      ['Target Source', sim.observationProposal.targetSource],
      ['Observing Band', sim.observationProposal.observingBand],
      ['Exposure Time', `${sim.observationProposal.exposureTime} ks`],
      ['Pushed By', sim.observationProposal.pushedBy],
      ['Status', sim.observationProposal.status],
    ];

    propParams.forEach(([k, v]) => {
      newPageCheck(6);
      addText(k, 9, 'bold', [100, 100, 130]);
      doc.text(`${k}:`, marginLeft, y);
      addText(v, 9, 'normal', [220, 220, 230]);
      doc.text(v, marginLeft + 55, y);
      y += 5;
    });
  }

  y = pageHeight - 15;
  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - 15, y);
  y += 3;
  addText('GRMHD Jet Feedback Lab · Black Hole Accretion Disk Simulation Platform', 7, 'italic', [100, 100, 130]);
  doc.text('GRMHD Jet Feedback Lab · Black Hole Accretion Disk Simulation Platform', marginLeft, y);

  return doc.output('arraybuffer');
}
