const supportedProductionModes = Object.freeze(['validation', 'publish']);

function formatTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((values, part) => {
    values[part.type] = part.value;
    return values;
  }, {});
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

export function resolveProductionMode({ argv = process.argv.slice(2), env = process.env } = {}) {
  const flagIndex = argv.findIndex((arg) => arg === '--mode');
  const inlineFlag = argv.find((arg) => arg.startsWith('--mode='));
  const requestedMode = inlineFlag?.split('=')[1] ?? (flagIndex >= 0 ? argv[flagIndex + 1] : undefined) ?? env.MARKETING_PRODUCTION_MODE ?? 'validation';
  if (!supportedProductionModes.includes(requestedMode)) {
    throw new Error(`Unsupported marketing production mode "${requestedMode}". Supported modes: ${supportedProductionModes.join(', ')}.`);
  }
  return requestedMode;
}

export function createProductionRunContext({ mode = 'validation', timestamp = formatTimestamp() } = {}) {
  if (!supportedProductionModes.includes(mode)) {
    throw new Error(`Unsupported marketing production mode "${mode}". Supported modes: ${supportedProductionModes.join(', ')}.`);
  }
  return Object.freeze({
    mode,
    timestamp,
    publishedOutputPath: mode === 'publish' ? `docs/demo/familyboard-preview-${timestamp}.mp4` : undefined,
  });
}

export { supportedProductionModes };
