import authService from './auth.service.js';
import { successResponse } from '../../utils/response.js';

class AuthController {
  /**
   * Sends an email verification code.
   */
  async sendVerificationCode(req, res, next) {
    try {
      const { email } = req.body;
      await authService.sendVerificationCode(email);
      return successResponse(res, 'Verification code sent successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifies the email verification code.
   */
  async verifyCode(req, res, next) {
    try {
      const { email, code } = req.body;
      await authService.verifyCode(email, code);
      return successResponse(res, 'Email verified successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers a Business user and their business profile.
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      // Set cookie for access and refresh tokens (best practice)
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15m
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
      });

      return successResponse(res, 'Business registered successfully', result, 210);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Performs email & password authentication.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Set cookies
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15m
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
      });

      return successResponse(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refreshes JWT tokens using the current refresh token.
   */
  async refresh(req, res, next) {
    try {
      const incomingRefreshToken = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

      if (!incomingRefreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          errors: []
        });
      }

      const result = await authService.refreshTokens(incomingRefreshToken);

      // Update cookies
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15m
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
      });

      return successResponse(res, 'Tokens refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out the user by revoking their database-level refresh token.
   */
  async logout(req, res, next) {
    try {
      const userId = req.user.id;
      await authService.logout(userId);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return successResponse(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
