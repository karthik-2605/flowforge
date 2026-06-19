const BaseStrategy = require('./base.strategy');
const axios = require('axios');

class WebhookStrategy extends BaseStrategy {
  async execute(payload) {
    const {
      url,
      method = 'POST',
      body,
    } = payload;

    console.log(
      `[WebhookStrategy] Calling ${method} ${url}`
    );

    const response = await axios({
      method,
      url,
      data: body,
      timeout: 10000,
    });

    return {
      status: response.status,
      url,
    };
  }
}

module.exports = WebhookStrategy;