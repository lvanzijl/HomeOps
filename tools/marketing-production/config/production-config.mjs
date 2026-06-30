export const productionConfig = Object.freeze({
  productionName: 'familyboard-marketing-preview-v1',
  storyboard: Object.freeze({
    id: 'familyboard-marketing-preview-v1',
    modulePath: '../marketing-recording/storyboards/marketing-preview-v1.mjs',
    exportName: 'marketingPreviewV1Storyboard',
    validateExportName: 'validateMarketingPreviewV1Storyboard',
  }),
  runtime: Object.freeze({
    apiProject: 'src/HomeOps.Api/HomeOps.Api.csproj',
    environment: 'VisualReview',
    apiUrl: 'http://127.0.0.1:5108',
    apiHealthPath: '/health',
    appUrl: 'http://127.0.0.1:5173',
    fixtureBaseUrl: 'http://127.0.0.1:5108',
    frontendDirectory: 'src/HomeOps.Client',
    frontendHost: '127.0.0.1',
    frontendPort: 5173,
    startupTimeoutMs: 60000,
    shutdownTimeoutMs: 8000,
    visualReviewRuntimeDocument: 'docs/development/visual-review-runtime.md',
  }),
  output: Object.freeze({
    path: 'artifacts/marketing/familyboard-marketing-preview-v1',
    reportPath: 'artifacts/marketing/familyboard-marketing-preview-v1/report.json',
    rawRecordingPath: '/tmp/familyboard-marketing-preview-v1.webm',
    rawRecordingDirectory: '/tmp/homeops-marketing-recording',
    outputFileName: 'familyboard-preview.mp4',
  }),
  toolchain: Object.freeze({
    directory: '/tmp/familyboard-marketing-tools',
    playwrightPackage: 'playwright',
  }),
  metadata: Object.freeze({
    path: '/tmp/familyboard-marketing-metadata.json',
    timingPath: '/tmp/familyboard-marketing-timing.json',
  }),
});
