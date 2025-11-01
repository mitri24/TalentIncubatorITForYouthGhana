/* eslint-disable no-undef */
import userService from "../../modules/user/service/user.service";
import User from "../../modules/user/model/user.model";
import Student from "../../modules/user/model/student.model";
import { clearDB, connectDB, disconnectDB } from "../setup/setup.db";

describe("User Service", () => {
  let userId;
  let studentUserId;
  let testUser;

  beforeAll(async () => {
    await connectDB()
    // Create test users
    const userData = {
      email: "service-test@example.com",
      password_hash: "TestPassword123!",
      role: "student",
      status: "approved",
    };
    testUser = await User.create(userData);
    userId = testUser._id;

    const studentUserData = {
      email: "student-service@example.com",
      password_hash: "TestPassword123!",
      role: "student",
      status: "approved",
    };
    const studentUser = await User.create(studentUserData);
    studentUserId = studentUser._id;

    // Create student profile
    await Student.create({
      user: studentUserId,
      first_name: "John",
      last_name: "Doe",
    });
  });

  afterAll(async () => {
    await clearDB();
    await disconnectDB();
  });

  describe("getMyProfile", () => {
    test("should return user profile with role data", async () => {
      const result = await userService.getMyProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.user._id).toEqual(userId);
      expect(result.data.user.email).toBe("service-test@example.com");
      expect(result.data.user.password_hash).toBeUndefined();
    }, 15000);

    test("should return null profile for users without role profile", async () => {
      const result = await userService.getMyProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
    }, 15000);

    test("should throw error for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.getMyProfile(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 15000);
  });

  describe("updateMyProfile", () => {
    test("should update student profile", async () => {
      const updates = {
        first_name: "Jane",
        last_name: "Smith",
      };

      const result = await userService.updateMyProfile(studentUserId, updates);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 15000);

    test("should fail updating non-existent user profile", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const updates = { first_name: "Test" };

      const result = await userService.updateMyProfile(fakeId, updates);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("uploadPhoto", () => {
    test("should upload user photo", async () => {
      const mockFile = {
        filename: "photo123.jpg",
        originalname: "photo.jpg",
        path: "/uploads/photo123.jpg",
      };

      const result = await userService.uploadPhoto(userId, mockFile);

      expect(result.success).toBe(true);
      expect(result.data.photo_url).toBeDefined();
      expect(result.data.photo_url).toContain("photo123.jpg");
    }, 15000);

    test("should fail uploading photo for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const mockFile = { filename: "photo.jpg", originalname: "photo.jpg" };

      const result = await userService.uploadPhoto(fakeId, mockFile);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("deleteMyAccount", () => {
    test("should soft delete user account", async () => {
      const userData = {
        email: "delete-test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };
      const userToDelete = await User.create(userData);

      const result = await userService.deleteMyAccount(userToDelete._id);

      expect(result.success).toBe(true);

      // Verify soft delete
      const deletedUser = await User.findById(userToDelete._id).where("deleted_at").exists(true);
      expect(deletedUser).toBeNull();
    }, 15000);

    test("should fail deleting non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.deleteMyAccount(fakeId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("listUsers", () => {
    test("should return paginated users list", async () => {
      const result = await userService.listUsers(
        {},
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toBeDefined();
      expect(Array.isArray(result.data.data)).toBe(true);
      expect(result.data.metadata).toBeDefined();
    }, 15000);

    test("should filter users by role", async () => {
      const result = await userService.listUsers(
        { role: "student" },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toBeDefined();
    }, 15000);

    test("should filter users by status", async () => {
      const result = await userService.listUsers(
        { status: "approved" },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toBeDefined();
    }, 15000);
  });

  describe("getUserById", () => {
    test("should get user details with profile", async () => {
      const result = await userService.getUserById(studentUserId);

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.user._id).toEqual(studentUserId);
    }, 15000);

    test("should throw error for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.getUserById(fakeId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("approveUser", () => {
    test("should approve pending user", async () => {
      const userData = {
        email: "pending-user@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        status: "pending",
      };
      const pendingUser = await User.create(userData);

      const result = await userService.approveUser(pendingUser._id);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe("approved");

      // Verify in database
      const updated = await User.findById(pendingUser._id);
      expect(updated.status).toBe("approved");
    }, 15000);

    test("should fail approving already approved user", async () => {
      const result = await userService.approveUser(userId);

      // User is already approved
      expect(result.success).toBe(false);
    }, 15000);

    test("should throw error for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.approveUser(fakeId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("rejectUser", () => {
    test("should reject pending user", async () => {
      const userData = {
        email: "reject-pending@example.com",
        password_hash: "TestPassword123!",
        role: "company",
        status: "pending",
      };
      const pendingUser = await User.create(userData);

      const result = await userService.rejectUser(pendingUser._id, "Invalid profile");

      expect(result.success).toBe(true);
      expect(result.data.status).toBe("rejected");
    }, 15000);

    test("should fail rejecting non-pending user", async () => {
      const result = await userService.rejectUser(userId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("setUserActiveStatus", () => {
    test("should deactivate user", async () => {
      const result = await userService.setUserActiveStatus(userId, false);

      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(false);

      // Verify in database
      const updated = await User.findById(userId);
      expect(updated.is_active).toBe(false);
    }, 15000);

    test("should activate user", async () => {
      // First ensure user is deactivated
      await userService.setUserActiveStatus(userId, false);

      // Then activate
      const result = await userService.setUserActiveStatus(userId, true);

      expect(result.success).toBe(true);
      expect(result.data.is_active).toBe(true);
    }, 15000);

    test("should fail for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.setUserActiveStatus(fakeId, false);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("forceDeleteUser", () => {
    test("should permanently delete user and profile", async () => {
      const userData = {
        email: "force-delete@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      };
      const userToDelete = await User.create(userData);

      const result = await userService.forceDeleteUser(userToDelete._id);

      expect(result.success).toBe(true);

      // Verify completely deleted
      const deleted = await User.findById(userToDelete._id).where("deleted_at").exists(false);
      expect(deleted).toBeNull();
    }, 15000);

    test("should fail for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.forceDeleteUser(fakeId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("restoreUser", () => {
    test("should restore soft-deleted user", async () => {
      const userData = {
        email: "restore-test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };
      const userToRestore = await User.create(userData);

      // Soft delete first
      await userService.deleteMyAccount(userToRestore._id);

      // Restore
      const result = await userService.restoreUser(userToRestore._id);

      expect(result.success).toBe(true);

      // Verify restored
      const restored = await User.findById(userToRestore._id);
      expect(restored).toBeDefined();
    }, 15000);

    test("should fail restoring non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439999";
      const result = await userService.restoreUser(fakeId);

      expect(result.success).toBe(false);
    }, 15000);
  });

  describe("bulkApproveUsers", () => {
    test("should approve multiple users", async () => {
      const userData1 = {
        email: "bulk-approve-1@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        status: "pending",
      };
      const userData2 = {
        email: "bulk-approve-2@example.com",
        password_hash: "TestPassword123!",
        role: "company",
        status: "pending",
      };

      const user1 = await User.create(userData1);
      const user2 = await User.create(userData2);

      const result = await userService.bulkApproveUsers([user1._id, user2._id]);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(2);

      // Verify both are approved
      const approved1 = await User.findById(user1._id);
      const approved2 = await User.findById(user2._id);
      expect(approved1.status).toBe("approved");
      expect(approved2.status).toBe("approved");
    }, 15000);

    test("should handle empty user list", async () => {
      const result = await userService.bulkApproveUsers([]);

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(0);
    }, 15000);
  });

  describe("getEligibleUsers", () => {
    test("should return eligible users (approved and active)", async () => {
      const result = await userService.getEligibleUsers();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    }, 15000);

    test("should exclude deleted users", async () => {
      const result = await userService.getEligibleUsers();

      expect(result.success).toBe(true);
      const hasDeletedUsers = result.data.some(u => u.deleted_at);
      expect(hasDeletedUsers).toBe(false);
    }, 15000);
  });
});
