/**
 * Company Repository
 * Handles company profile data access
 */
import { BaseRepository } from "../../shared/base.repository";
import Company from "../model/company.model";
import { ERROR_MESSAGES } from "../../../utils/constants";

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Company);
  }

  /**
   * Create a new company profile
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
   * Update company profile
   * @param {Object} query
   * @param {Object} updates
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async updateProfile(query, updates, options = {}) {
    return await this.update(query, updates, options);
  }

  /**
   * Get company by user ID
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async getByUserId(userId, options = {}) {
    return await this.findOne({ user: userId }, options);
  }

  /**
   * Soft delete company profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async deleteByUserId(userId, options = {}) {
    return await this.delete({ user: userId }, options);
  }

  /**
   * Restore company profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async restoreByUserId(userId, options = {}) {
    return await this.restore({ user: userId }, options);
  }

   /**
   * Force delete profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async forceDeleteByUserId(userId, options = {}) {
    return await this.forceDelete({ user: userId }, options);
  } 

  /**
   * Get active companies (for job posting)
   * @param {Object} [filters]
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @param {Object} [options]
   * @returns {Promise<{ data: Array, metadata: Object }>}
   */
  async getActiveCompanies(filters = {}, page = 1, limit = 10, options = {}) {
    const queryFilters = {
      ...filters,
      deleted_at: null,
    };
    return await this.findAll(queryFilters, page, limit, options);
  }
}

export const companyRepository = new CompanyRepository();
export default companyRepository;