/**
 * User Service
 * Handles user profile management, admin operations, and business logic
 * Auth-related methods (login, tokens, password reset) handled by AuthService
 */

import BaseService from "../../shared/base.service";
import { userRepository } from "../repositories/user.repository";
import { studentRepository } from "../repositories/student.repository";
import { companyRepository } from "../repositories/company.repository";
import { adminRepository } from "../repositories/admin.repository";
import UserValidation from "../validation/user.validation";
import { ERROR_MESSAGES } from "../../../utils/constants";

// Attach validation to BaseService (done once at startup, but here for completeness)
BaseService.setValidation(UserValidation);

class UserService extends BaseService {
  constructor() {
    super({
      user: userRepository,
      student: studentRepository,
      company: companyRepository,
      admin: adminRepository,
    });
  }

  // ========================================
  // 1. USER PROFILE MANAGEMENT (Self-Service)
  // ========================================

  /**
   * Get current user's profile with populated data
   * @param {string} userId - Current user's ID
   * @param {Object} [options] - { select, populate, includeDeleted }
   * @returns {Promise<Object>} - { user, profile }
   */
  async getMyProfile(userId, options = {}) {
    return this.runInContext({ action: "getMyProfile", userId }, async () => {
      try {
        this.log("getMyProfile.start", { userId });

        const user = await this.repo("user").findById(userId, {
          ...options,
        });

        if (!user) {
          throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        }

        // Populate profile based on role
        const profile = await this._getProfileByRole(user.role, user._id, options);

        const result = {
          user: user.deserialize({ exclude: ["password_hash"] }),
          profile,
        };

        this.log("getMyProfile.success", { userId });
        return this.success(result);
      } catch (error) {
        return this.error(error, "Failed to fetch profile");
      }
    });
  }

  /**
   * Update current user's profile
   * @param {string} userId - Current user's ID
   * @param {Object} updates - Partial updates
   * @param {Object} [options]
   * @returns {Promise<Object>} - Updated profile
   */
  async updateMyProfile(userId, updates, options = {}) {
    return this.runInContext({ action: "updateMyProfile", userId }, async () => {
      try {
        this.log("updateMyProfile.start", { userId, updatesKeys: Object.keys(updates) });

        const user = await this.repo("user").findById(userId);
        if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

        // Validate updates based on role
        const updateSchema = this._getUpdateSchemaForRole(user.role);
        const cleanUpdates = this.validate(updates, updateSchema);

        let result;
        if (user.role === "student") {
          result = await this.repo("student").update({ user: userId }, cleanUpdates, options);
        } else if (user.role === "company") {
          result = await this.repo("company").update({ user: userId }, cleanUpdates, options);
        } else if (user.role === "admin") {
          result = await this.repo("admin").update({ user: userId }, cleanUpdates, options);
        }

        if (!result) {
          throw new Error("Profile update failed");
        }

        this.log("updateMyProfile.success", { userId });
        return this.success(result);
      } catch (error) {
        return this.error(error, "Failed to update profile");
      }
    });
  }

  /**
   * Upload user photo/profile picture
   * @param {string} userId
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} - { photo_url }
   */
  async uploadPhoto(userId, file) {
    return this.runInContext({ action: "uploadPhoto", userId }, async () => {
      try {
        this.log("uploadPhoto.start", { userId, fileName: file?.originalname });

        // TODO: Implement file upload to storage (S3/local)
        // const photoUrl = await FileStorage.upload(file, "profiles");
        const photoUrl = `/uploads/profiles/${file.filename}`; // Placeholder

        const updateData = { photo_url: photoUrl };
        const user = await this.repo("user").updateById(userId, updateData);

        if (!user) throw new Error("User not found");

        this.log("uploadPhoto.success", { userId, photoUrl });
        return this.success({ photo_url: photoUrl });
      } catch (error) {
        return this.error(error, "Failed to upload photo");
      }
    });
  }

  /**
   * Delete current user's account (soft delete)
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async deleteMyAccount(userId) {
    return this.runInContext({ action: "deleteMyAccount", userId }, async () => {
      try {
        this.log("deleteMyAccount.start", { userId });

        return await this.transaction(async (session) => {
          // Soft delete user
          const user = await this.repo("user").delete(userId, { session });
          if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

          // Soft delete profile
          const profileRepo = this._getProfileRepoByRole(user.role);
          if (profileRepo) {
            await profileRepo.delete({ user: userId }, { session });
          }

          this.log("deleteMyAccount.success", { userId });
          return this.success({ user, message: "Account deleted successfully" });
        });
      } catch (error) {
        return this.error(error, "Failed to delete account");
      }
    });
  }

  // ========================================
  // 2. ADMIN OPERATIONS
  // ========================================

  /**
   * List users for admin panel (search, filter, paginate)
   * @param {Object} filters - { role, status, searchTerm, is_active }
   * @param {Object} pagination - { page, limit }
   * @param {Object} [options] - { select, sort, includeDeleted }
   * @returns {Promise<Object>}
   */
  async listUsers(filters = {}, pagination = { page: 1, limit: 10 }, options = {}) {
    return this.runInContext({ action: "listUsers" }, async () => {
      try {
        this.log("listUsers.start", { filters, pagination, options });

        // Validate pagination
        const { page, limit } = this.validate(pagination, UserValidation.searchUsersSchema);

        // Build filters
        const queryFilters = {
          ...filters,
          ...(options.includeDeleted ? {} : { deleted_at: null }),
        };

        const result = await this.repo("user").findAll(queryFilters, page, limit, {
          ...options,
          select: options.select || "email role status is_active created_at",
          sort: options.sort || { created_at: -1 },
        });

        this.log("listUsers.success", { total: result.metadata.total });
        return this.success(result);
      } catch (error) {
        return this.error(error, "Failed to list users");
      }
    });
  }

  /**
   * Get detailed user info for admin
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async getUserById(userId, options = {}) {
    return this.runInContext({ action: "getUserById", userId }, async () => {
      try {
        this.log("getUserById.start", { userId });

        const user = await this.repo("user").findById(userId, {
          ...options,
          includeDeleted: options.includeDeleted || false,
        });

        if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

        const profile = await this._getProfileByRole(user.role, userId, options);

        const result = {
          user: user.deserialize({ exclude: ["password_hash"] }),
          profile,
          applicationsCount: await this._getApplicationsCount(userId),
          // TODO: Add more admin stats
        };

        this.log("getUserById.success", { userId });
        return this.success(result);
      } catch (error) {
        return this.error(error, "Failed to fetch user details");
      }
    });
  }

  /**
   * Approve pending user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async approveUser(userId) {
    return this.runInContext({ action: "approveUser", userId }, async () => {
      try {
        this.log("approveUser.start", { userId });

        const user = await this.repo("user").updateById(userId, {
          status: "approved",
          updated_at: Date.now(),
        });

        if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        if (user.status === "approved") throw new Error("User already approved");

        // TODO: Queue welcome email via Agenda.js
        // await agendaQueue.now('sendWelcomeEmail', { userId });

        this.log("approveUser.success", { userId });
        return this.success(user, { message: "User approved successfully" });
      } catch (error) {
        return this.error(error, "Failed to approve user");
      }
    });
  }

  /**
   * Reject pending user
   * @param {string} userId
   * @param {string} [reason]
   * @returns {Promise<Object>}
   */
  async rejectUser(userId, reason = "") {
    return this.runInContext({ action: "rejectUser", userId }, async () => {
      try {
        this.log("rejectUser.start", { userId, reason });

        const user = await this.repo("user").updateById(userId, {
          status: "rejected",
          ...(reason && { rejection_reason: reason }),
          updated_at: Date.now(),
        });

        if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        if (user.status !== "pending") throw new Error("User must be pending to reject");

        // TODO: Queue rejection email
        // await agendaQueue.now('sendRejectionEmail', { userId, reason });

        this.log("rejectUser.success", { userId });
        return this.success(user, { message: "User rejected successfully" });
      } catch (error) {
        return this.error(error, "Failed to reject user");
      }
    });
  }

  /**
   * Toggle user activation status
   * @param {string} userId
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async setUserActiveStatus(userId, isActive) {
    return this.runInContext({ action: "setUserActiveStatus", userId }, async () => {
      try {
        this.log("setUserActiveStatus.start", { userId, isActive });

        const user = await this.repo("user").updateById(userId, {
          is_active: isActive,
          updated_at: Date.now(),
        });

        if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

        this.log("setUserActiveStatus.success", { userId, isActive });
        return this.success(user, { 
          message: isActive ? "User activated" : "User deactivated" 
        });
      } catch (error) {
        return this.error(error, "Failed to update user status");
      }
    });
  }

  /**
   * Permanently delete user (admin only)
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async forceDeleteUser(userId) {
    return this.runInContext({ action: "forceDeleteUser", userId }, async () => {
      try {
        this.log("forceDeleteUser.start", { userId });

        return await this.transaction(async (session) => {
          const user = await this.repo("user").forceDelete(userId, { session });
          if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

          // Delete profile
          const profileRepo = this._getProfileRepoByRole(user.role);
          if (profileRepo) {
            await profileRepo.forceDelete({ user: userId }, { session });
          }

          // TODO: Delete related applications, etc.
          this.log("forceDeleteUser.success", { userId });
          return this.success({ message: "User permanently deleted" });
        });
      } catch (error) {
        return this.error(error, "Failed to delete user permanently");
      }
    });
  }

  /**
   * Restore soft-deleted user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async restoreUser(userId) {
    return this.runInContext({ action: "restoreUser", userId }, async () => {
      try {
        this.log("restoreUser.start", { userId });

        return await this.transaction(async (session) => {
          const user = await this.repo("user").restore(userId, { session });
          if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

          // Restore profile
          const profileRepo = this._getProfileRepoByRole(user.role);
          if (profileRepo) {
            await profileRepo.restore({ user: userId }, { session });
          }

          this.log("restoreUser.success", { userId });
          return this.success(user, { message: "User restored successfully" });
        });
      } catch (error) {
        return this.error(error, "Failed to restore user");
      }
    });
  }

  // ========================================
  // 3. BULK OPERATIONS
  // ========================================

  /**
   * Bulk approve multiple users
   * @param {string[]} userIds
   * @returns {Promise<Object>}
   */
  async bulkApproveUsers(userIds) {
    return this.runInContext({ action: "bulkApproveUsers" }, async () => {
      try {
        this.log("bulkApproveUsers.start", { count: userIds.length });

        return await this.transaction(async (session) => {
          const updates = userIds.map(id => 
            this.repo("user").update({ _id: id, status: "pending" }, 
              { status: "approved", updated_at: Date.now() }, 
              { session })
          );

          const results = await Promise.all(updates);
          const successCount = results.filter(Boolean).length;

          this.log("bulkApproveUsers.success", { successCount });
          return this.success({ count: successCount, message: `${successCount} users approved` });
        });
      } catch (error) {
        return this.error(error, "Failed to bulk approve users");
      }
    });
  }

  // ========================================
  // 4. UTILITY METHODS
  // ========================================

  /**
   * Get users eligible for various features (tokens, notifications, etc.)
   * @param {Object} [options]
   * @returns {Promise<Array>}
   */
  async getEligibleUsers(options = {}) {
    return this.runInContext({ action: "getEligibleUsers" }, async () => {
      try {
        this.log("getEligibleUsers.start");

        const filters = {
          status: "approved",
          is_active: true,
          deleted_at: null,
        };

        const result = await this.repo("user").findAll(filters, 1, 1000, options);
        this.log("getEligibleUsers.success", { count: result.data.length });

        return this.success(result.data);
      } catch (error) {
        return this.error(error, "Failed to fetch eligible users");
      }
    });
  }

  // ========================================
  // 5. PRIVATE HELPERS
  // ========================================

  /**
   * Get profile repository based on role
   * @param {string} role
   * @returns {any|null}
   */
  _getProfileRepoByRole(role) {
    const repoMap = {
      student: this.repos.student,
      company: this.repos.company,
      admin: this.repos.admin,
    };
    return repoMap[role] || null;
  }

  /**
   * Get profile data for a user by role
   * @param {string} role
   * @param {string} userId
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   * @private
   */
  async _getProfileByRole(role, userId, options = {}) {
    const repo = this._getProfileRepoByRole(role);
    if (!repo) return null;

    const profile = await repo.getUserById(userId, {
      ...options,
      includeDeleted: options.includeDeleted || false,
    });

    return profile ? profile.deserialize() : null;
  }

  /**
   * Get update validation schema for role
   * @param {string} role
   * @returns {Joi.Schema}
   * @private
   */
  _getUpdateSchemaForRole(role) {
    return UserValidation.buildUpdateProfileSchema(role)
  }

  /**
   * Get user's applications count (for admin dashboard)
   * @param {string} userId
   * @returns {Promise<number>}
   * @private
   */
  async _getApplicationsCount(userId) {
    // TODO: Implement when applications module is ready
    // return await applicationsRepository.countDocuments({ student_id: userId });
    return 0; // Placeholder
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;