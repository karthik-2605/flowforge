const authService =
    require('../services/auth.service');

async function register(req, res) {
  try {
    const user =
      await authService.register(req.body);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const result =
      await authService.login(req.body);

    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
};