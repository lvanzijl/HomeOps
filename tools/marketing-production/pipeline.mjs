export const productionPhaseIds = Object.freeze(['runtime', 'storyboard', 'recording', 'audio', 'export', 'metadata', 'cleanup', 'reporting']);

const implementedPhaseIds = Object.freeze(['runtime', 'storyboard', 'recording', 'audio', 'export', 'metadata', 'cleanup']);

export function createProductionPipeline() {
  return Object.freeze(productionPhaseIds.map((id, index) => Object.freeze({ id, order: index + 1, implemented: implementedPhaseIds.includes(id), recordsMedia: false })));
}

export function validateProductionPipeline(pipeline = createProductionPipeline()) {
  const errors = [];
  const ids = pipeline.map((phase) => phase.id);
  for (const [index, expected] of productionPhaseIds.entries()) {
    if (ids[index] !== expected) errors.push(`Phase ${index + 1} must be ${expected}.`);
  }
  for (const phase of pipeline) {
    if (phase.recordsMedia) errors.push(`Phase ${phase.id} must not record media directly from the pipeline model.`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), phaseIds: Object.freeze(ids) });
}
