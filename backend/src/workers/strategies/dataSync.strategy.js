const BaseStrategy = require('./base.strategy');

class DataSyncStrategy extends BaseStrategy {
  async execute(payload) {
    const {
      source,
      destination,
    } = payload;

    console.log(
      `[DataSyncStrategy] Syncing ${source} → ${destination}`
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      synced: true,
      records: Math.floor(Math.random() * 500),
    };
  }
}

module.exports = DataSyncStrategy;