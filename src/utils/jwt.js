import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generates an Access Token (default expires in 15 minutes).
 * @param {object} user - User metadata (id, email, role)
 * @returns {string} Signed JWT Access Token
 */
export const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES
  });
};

/**
 * Generates a Refresh Token (default expires in 7 days).
 * @param {object} user - User metadata (id, email, role)
 * @returns {string} Signed JWT Refresh Token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES
  });
};

/**
 * Verifies an Access Token.
 * @param {string} token - Signed JWT Access Token
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

/**
 * Verifies a Refresh Token.
 * @param {string} token - Signed JWT Refresh Token
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
