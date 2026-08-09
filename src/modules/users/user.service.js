import userRepository from './user.repository.js';
import { AppError } from '../../utils/errors.js';

class UserService {
  /**
   * Retrieves a user by their ID, throwing an error if the user is not found.
   * @param {string} id - User ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    // Omit sensitive data like password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Retrieves a user by their email, returning null if not found.
   * Used for internal lookups.
   * @param {string} email - User email
   */
  async getUserByEmail(email) {
    return userRepository.findByEmail(email);
  }
}

export default new UserService();
