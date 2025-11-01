/**
 * Student Repository
 * Handles student profile data access
 */
import { BaseRepository } from "../../shared/base.repository";
import Student from "../model/student.model";
import { ERROR_MESSAGES } from "../../../utils/constants";

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  /**
   * Create a new student profile
   * @param {Object} data - Must include `user` (ObjectId)
   * @param {Object} [options] - { session, lean, etc. }
   * @returns {Promise<Object>}
   */
  async createProfile(data, options = {}) {
    if (!data.user) {
      throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
    }
    return await this.create(data, options);
  }

  /**
   * Update student profile
   * @param {Object} query - Usually { user: userId }
   * @param {Object} updates - Partial profile fields
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async updateProfile(query, updates, options = {}) {
    return await this.update(query, updates, options);
  }

  /**
   * Get student profile by user ID
   * @param {string} userId
   * @param {Object} [options] - { lean, select, includeDeleted }
   * @returns {Promise<Object|null>}
   */
  async getByUserId(userId, options = {}) {
    return await this.findOne({ user: userId }, options);
  }

  /**
   * Soft delete student profile by user ID
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async deleteByUserId(userId, options = {}) {
    return await this.delete({ user: userId }, options);
  }

  /**
   * Restore soft-deleted student profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async restoreByUserId(userId, options = {}) {
    return await this.restore({ user: userId }, options);
  }

  /**
   * Force delete student profile
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async forceDeleteByUserId(userId, options = {}) {
    return await this.forceDelete({ user: userId }, options);
  } 

  /**
   * Get students with job-seeking status
   * @param {Object} [filters]
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @param {Object} [options]
   * @returns {Promise<{ data: Array, metadata: Object }>}
   */
  async getJobSeekingStudents(filters = {}, page = 1, limit = 10, options = {}) {
    const queryFilters = {
      "status": "job_seeking",
      ...filters,
      deleted_at: null,
    };
    return await this.findAll(queryFilters, page, limit, options);
  }
}

export const studentRepository = new StudentRepository();
export default studentRepository;