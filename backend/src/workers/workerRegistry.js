const EmailStrategy = require('./strategies/email.strategy');
const WebhookStrategy = require('./strategies/webhook.strategy');
const ReportStrategy = require('./strategies/report.strategy');
const DataSyncStrategy = require('./strategies/dataSync.strategy');

const strategyMap = {
  email: EmailStrategy,
  webhook: WebhookStrategy,
  report: ReportStrategy,
  data_sync: DataSyncStrategy,
};

function getStrategy(jobType) {
  const StrategyClass = strategyMap[jobType];

  if (!StrategyClass) {
    throw new Error(
      `Unknown job type: ${jobType}`
    );
  }

  return new StrategyClass();
}

module.exports = {
  getStrategy,
};