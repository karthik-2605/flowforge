const BaseStrategy = require('./base.strategy');

class ReportStrategy extends BaseStrategy {
  async execute(payload) {
    const {
      reportType,
      filters,
    } = payload;

    console.log(
      `[ReportStrategy] Generating ${reportType} report`
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      reportType,
      filters,
      generatedAt: new Date().toISOString(),
      rowCount: Math.floor(Math.random() * 1000),
    };
  }
}

module.exports = ReportStrategy;