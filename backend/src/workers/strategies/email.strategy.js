const BaseStrategy = require('./base.strategy');

class EmailStrategy extends BaseStrategy {
  async execute(payload) {
    const { to, subject, body } = payload;

    console.log(
      `[EmailStrategy] Sending email to ${to}: "${subject}"`
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      sent: true,
      to,
      subject,
      body,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = EmailStrategy;