/**
 * The response utility functions for authentication module
 * This file defines reusable functions for sending standardized API responses
 * related to authentication processes
 * It helps maintain consistency in response formats across the authentication module
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_CONFIG } from '../../config/jwt.config';
import { SALT_ROUNDS, JWT_EXPIRATION } from '../constants';

const jwtLibrary = jwt;

export class AuthHelpers {
  /**
   * Generates a JWT token for a user
   * @param {string} userId - The user's unique identifier
   * @param {string} [role='student'] - The user's role
   * @param {string} [tokenType='access'] - Type of token (access, refresh, etc.)
   * @returns {string} The generated JWT token
   * @throws {Error} If token generation fails
   */
  static generateToken(userId, role = 'student', tokenType = 'access') {
    try {
      const expiresIn = JWT_EXPIRATION[tokenType.toUpperCase() + '_TOKEN'] || JWT_EXPIRATION.ACCESS_TOKEN;
      const payload = {
        id: userId,
        role,
        ...(JWT_CONFIG.CUSTOM_CLAIMS.includeStatus && { status: 'pending' }), // Example status
        ...(JWT_CONFIG.CUSTOM_CLAIMS.includeUserId && { userId }),
        ...(JWT_CONFIG.CUSTOM_CLAIMS.permissions && { permissions: ['read', 'write'] }), // Example
      };

      return jwtLibrary.sign(payload, JWT_CONFIG.SECRET_KEY, {
        ...JWT_CONFIG.TOKEN_OPTIONS,
        expiresIn,
        algorithm: JWT_CONFIG.ALGORITHM,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
      });
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verifies a JWT token and returns its payload
   * @param {string} token - The JWT token to verify
   * @returns {object} The decoded payload
   * @throws {Error} If verification fails
   */
  static verifyToken(token) {
    try {
      return jwtLibrary.verify(token, JWT_CONFIG.SECRET_KEY, {
        algorithms: JWT_CONFIG.VALIDATION.algorithms,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
        maxAge: JWT_CONFIG.VALIDATION.maxAge,
        ignoreExpiration: JWT_CONFIG.VALIDATION.ignoreExpiration,
      });
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Hashes a plain password
   * @param {string} plainPassword - The plain text password
   * @returns {Promise<string>} The hashed password
   * @throws {Error} If hashing fails
   */
  static async hashPassword(plainPassword) {
    try {
      return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Compares a plain password with a hashed password
   * @param {string} plainPassword - The plain text password
   * @param {string} hashedPassword - The hashed password to compare against
   * @returns {Promise<boolean>} True if passwords match, false otherwise
   * @throws {Error} If comparison fails
   */
  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }
}