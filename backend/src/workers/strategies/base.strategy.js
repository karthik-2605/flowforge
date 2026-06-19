class BaseStrategy {
  async execute(payload) {
    throw new Error(
      `execute() not implemented by ${this.constructor.name}`
    );
  }

  getName() {
    return this.constructor.name;
  }
}

module.exports = BaseStrategy;