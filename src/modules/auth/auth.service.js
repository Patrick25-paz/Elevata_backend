import authRepository from './auth.repository.js';
import userRepository from '../users/user.repository.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/errors.js';
import { sendEmail } from '../../utils/resend.js';

const verificationStore = new Map();

class AuthService {
  /**
   * Generates a 6-digit numeric verification code and sends it via Resend.
   * @param {string} email - Recipient email
   */
  async sendVerificationCode(email) {
    if (!email) {
      throw new AppError('Email address is required', 400);
    }

    // Check if email is already taken
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email address is already registered', 409);
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in-memory
    verificationStore.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified: false
    });

    // Send email using Resend
    const subject = 'Verify your email - Elevata';
    const html = `
      <div style="background-color: #f8fafc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.02);">
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/vamxvage/image/upload/v1786182605/elevata_logo_new_nrtjnj.png" alt="Elevata Logo" style="height: 48px; width: 48px; display: inline-block; vertical-align: middle; margin-right: 10px;" />
            <span style="font-size: 24px; font-weight: 800; color: #0f74e7; letter-spacing: -0.03em; vertical-align: middle;">Elevata</span>
          </div>
          
          <!-- Title -->
          <h1 style="font-size: 22px; font-weight: 800; color: #1e293b; text-align: center; margin: 0 0 12px 0; letter-spacing: -0.02em;">Verify your email address</h1>
          
          <p style="font-size: 15px; color: #64748b; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
            Thank you for choosing Elevata. Enter the verification code below in your registration window to activate your account.
          </p>
          
          <!-- Code Box -->
          <div style="background: linear-gradient(135deg, #f0f6ff 0%, #e5f0ff 100%); border: 1px solid #bfdbfe; border-radius: 16px; padding: 24px 20px; text-align: center; margin: 0 0 32px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Verification Code</div>
            <div style="font-size: 36px; font-weight: 800; color: #0f74e7; letter-spacing: 8px; font-family: 'SF Pro Mono', Menlo, Monaco, Consolas, monospace; display: inline-block; padding-left: 8px;">
              ${code}
            </div>
          </div>
          
          <!-- Warning -->
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center; margin: 0 0 40px 0;">
            This code is active for <strong>10 minutes</strong>. If you did not initiate this request, you can safely disregard this message.
          </p>
          
          <!-- Divider -->
          <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
          
          <!-- Footer -->
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">
              Need help? Contact our support team at <a href="mailto:support@elevata.com" style="color: #0f74e7; text-decoration: none; font-weight: 600;">support@elevata.com</a>
            </p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
              &copy; 2026 Elevata. All rights reserved.<br />
              Kigali, Rwanda
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail({ to: email, subject, html });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new AppError('Failed to send verification email. Please check your address or try again.', 500);
    }

    return true;
  }

  /**
   * Validates the 6-digit verification code.
   * @param {string} email - User email
   * @param {string} code - Submitted code
   */
  async verifyCode(email, code) {
    if (!email || !code) {
      throw new AppError('Email and verification code are required', 400);
    }

    const verification = verificationStore.get(email);
    if (!verification) {
      throw new AppError('No verification code was sent for this email address', 400);
    }

    if (verification.expiresAt < Date.now()) {
      verificationStore.delete(email);
      throw new AppError('Verification code has expired', 400);
    }

    if (verification.code !== code) {
      throw new AppError('Invalid verification code', 400);
    }

    // Mark as verified, extend validity for registration flow
    verificationStore.set(email, {
      code,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes to complete registration
      verified: true
    });

    return true;
  }

  /**
   * Registers a business user and hashes their password.
   * @param {object} data - Full registration request body
   */
  async register(data) {
    // 0. Verify email has been verified
    const verification = verificationStore.get(data.email);
    if (!verification || !verification.verified) {
      throw new AppError('Email address has not been verified', 400);
    }

    // 1. Check if email is already taken
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email address is already registered', 409);
    }

    // 2. Hash the user's password
    const hashedPassword = await hashPassword(data.password);

    // 3. Separate core credentials
    const userData = {
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      isVerified: true
    };

    let newUser;

    // 4. Save to database based on registration type
    if (data.registrationType === 'FINANCIAL_INSTITUTION') {
      const fiData = {
        institutionName: data.institutionName,
        representativeName: data.representativeName,
        category: data.category,
        operatingScope: data.operatingScope,
        licenseNumber: data.licenseNumber,
        website: data.website || null
      };
      newUser = await authRepository.registerFinancialInstitution(userData, fiData);
    } else {
      const businessData = {
        businessName: data.businessName,
        ownerName: data.ownerName,
        businessType: data.businessType,
        province: data.province,
        district: data.district,
        sector: data.sector,
        cell: data.cell,
        village: data.village,
        knownPlace: data.knownPlace,
        latitude: data.latitude,
        longitude: data.longitude
      };
      newUser = await authRepository.registerBusiness(userData, businessData);
    }

    // Clean up verification store
    verificationStore.delete(data.email);

    // 5. Generate authentication tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // 6. Save active refresh token in database
    await userRepository.updateRefreshToken(newUser.id, refreshToken);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified,
        isPilotApproved: newUser.isPilotApproved,
        business: newUser.business || null,
        financialInstitution: newUser.financialInstitution || null
      },
      token: accessToken,
      refreshToken
    };
  }

  /**
   * Logs a user in after validating their credentials.
   * @param {string} email - Email
   * @param {string} password - Raw password
   */
  async login(email, password) {
    // 1. Fetch user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // 2. Compare passwords
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // 3. Check active state
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5. Save refresh token to database
    await userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isPilotApproved: user.isPilotApproved,
        business: user.business || null,
        financialInstitution: user.financialInstitution || null
      },
      token: accessToken,
      refreshToken
    };
  }

  /**
   * Refreshes JWT access and refresh tokens.
   * Performs token rotation and verifies validity.
   * @param {string} incomingRefreshToken - Refresh token from user
   */
  async refreshTokens(incomingRefreshToken) {
    try {
      // 1. Verify the signature and expiration of the token
      const decoded = verifyRefreshToken(incomingRefreshToken);

      // 2. Fetch user to confirm active state and check saved token matches
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive || user.refreshToken !== incomingRefreshToken) {
        throw new AppError('Invalid or expired refresh token. Please login again.', 401);
      }

      // 3. Generate new token pair (rotation)
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // 4. Update the database with the rotated token
      await userRepository.updateRefreshToken(user.id, newRefreshToken);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError(error.message || 'Token refresh failed.', 401);
    }
  }

  /**
   * Revokes the refresh token, logging the user out.
   * @param {string} userId - User ID
   */
  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
    return true;
  }
}

export default new AuthService();
