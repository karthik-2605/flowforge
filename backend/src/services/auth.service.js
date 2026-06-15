const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepo = require('../repositories/user.repository');

async function register({
  email,
  password,
  name,
}) {
  const existing =
    await userRepo.findByEmail(email);

  if (existing) {
    throw new Error(
      'Email already registered'
    );
  }

  const hashed = await bcrypt.hash(
    password,
    12
  );

  const user = await userRepo.create({
    email,
    password: hashed,
    name,
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

async function login({
  email,
  password,
}) {
  const user =
    await userRepo.findByEmail(email);

  if (!user) {
    throw new Error(
      'Invalid credentials'
    );
  }

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid) {
    throw new Error(
      'Invalid credentials'
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

module.exports = {
  register,
  login,
};