const authService =
    require('../services/auth.service');
const { success, error } = require('../utilities/responseHelper');

async function register(req, res) {
  try {
    const result =
      await authService.register(req.body);

    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
}

async function login(req, res) {
  try {
    const result =
      await authService.login(req.body);

    return success(res, result, 200);
  } catch (err) {
    return error(res, err.message, 401);
  }
}

module.exports = {
  register,
  login,
};