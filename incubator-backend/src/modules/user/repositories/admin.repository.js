/**
 * Admin Repository
 * Handles admin profile data access
 */
import { BaseRepository } from "../../shared/base.repository";
import Admin from "../model/admin.model";
import { ERROR_MESSAGES } from "../../../utils/constants";

class AdminRepository extends BaseRepository {
  constructor() {
    super(Admin);
  }

  /**
   * Create a new admin profile
   * @param {Object} data - Must include `user`
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async createProfile(data, options = {}) {
    if (!data.user) {
      throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
    }
    return await this.create(data, options);
  }

  /**
   * Update admin profile
   * @param {Object} query
   * @param {Object} updates
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async updateProfile(query, updates, options = {}) {
    return await this.update(query, updates, options);
  }

  /**
   * Get admin by user ID
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async getByUserId(userId, options = {}) {
    return await this.findOne({ user: userId }, options);
  }

  /**
   * Soft delete admin profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async deleteByUserId(userId, options = {}) {
    return await this.delete({ user: userId }, options);
  }

  /**
   * Restore admin profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async restoreByUserId(userId, options = {}) {
    return await this.restore({ user: userId }, options);
  }

  /**
   * Get all super admins
   * @param {Object} [options]
   * @returns {Promise<Array>}
   */
  async getSuperAdmins(options = {}) {
    return (await this.findAll({ permissions: "super" }, 1, 100, options)).data;
  }
}

export const adminRepository = new AdminRepository();
export default adminRepository;