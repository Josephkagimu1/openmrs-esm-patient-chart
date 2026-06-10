import { defineConfigSchema, getSyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import aiSummaryOverviewComponent from './ai-summary/ai-summary-overview.component';

const moduleName = '@openmrs/esm-patient-ai-summary-app';

const options = {
  featureName: 'patient-ai-summary',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const aiSummaryOverview = getSyncLifecycle(aiSummaryOverviewComponent, options);
