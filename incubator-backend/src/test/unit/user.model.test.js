/* eslint-disable no-undef */
/**
 * Unit tests for User model
 * Tests schema validation, default values, hooks, and custom methods
 */

import User from "../../modules/user/model/user.model";
import { AuthHelpers } from "../../utils/helpers/auth.helpers";
import { connectDB, disconnectDB } from "../setup/setup.db";

describe("User Model", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe("Schema Validation", () => {
    test("should create a user with required fields", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("student");
      expect(user.password_hash).toBeDefined();
    });

    test("should have required email field", async () => {
      const userData = {
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    test("should have required password_hash field", async () => {
      const userData = {
        email: "test@example.com",
        role: "student",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.password_hash).toBeDefined();
    });

    test("should have required role field", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test("should validate role enum values", async () => {
      const invalidRoleData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "invalid_role",
      };

      const user = new User(invalidRoleData);
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test("should accept valid role values (student, company, admin)", async () => {
      const roles = ["student", "company", "admin"];

      for (const role of roles) {
        const userData = {
          email: `test-${role}@example.com`,
          password_hash: "TestPassword123!",
          role,
        };

        const user = new User(userData);
        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.role).toBe(role);
      }
    });

    test("should validate status enum values", async () => {
      const invalidStatusData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        status: "invalid_status",
      };

      const user = new User(invalidStatusData);
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test("should accept valid status values", async () => {
      const statuses = ["approved", "pending", "deleted", "rejected"];

      for (const status of statuses) {
        const userData = {
          email: `test-${status}@example.com`,
          password_hash: "TestPassword123!",
          role: "student",
          status,
        };

        const user = new User(userData);
        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.status).toBe(status);
      }
    });
  });

  describe("Default Values", () => {
    test("should have default is_active as true", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.is_active).toBe(true);
    });

    test("should have default status as pending", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.status).toBe("pending");
    });

    test("should have default email_verified as false", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.email_verified).toBe(false);
    });

    test("should have default photo_url as null", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.photo_url).toBeNull();
    });

    test("should have default last_login as null", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.last_login).toBeNull();
    });

    test("should have default email_verified_at as null", () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.email_verified_at).toBeNull();
    });
  });

  describe("Pre-save Hooks", () => {
    test("should hash plain password on save (with $ prefix detection)", async () => {
      const userData = {
        email: "test-prehash@example.com",
        password_hash: "PlainPassword123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      expect(user.password_hash).not.toBe("PlainPassword123!");
      expect(user.password_hash.startsWith("$2b$")).toBe(true);
    });

    test("should not re-hash already hashed password", async () => {
      const hashedPassword = await AuthHelpers.hashPassword("TestPassword123!");
      const userData = {
        email: "test-nohash@example.com",
        password_hash: hashedPassword,
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      expect(user.password_hash).toBe(hashedPassword);
    });
  });

  describe("Custom Methods", () => {
    test("should hash and set password via setPassword() method", async () => {
      const userData = {
        email: "setpass@example.com",
        password_hash: "InitialPassword123!",
        role: "student",
      };

      const user = new User(userData);
      await user.setPassword("NewPassword456!");

      expect(user.password_hash).not.toBe("NewPassword456!");
      expect(user.password_hash.startsWith("$2b$")).toBe(true);
    });

    test("should verify password with verifyPassword() method", async () => {
      const plainPassword = "VerifyPassword789!";
      const userData = {
        email: "verify@example.com",
        password_hash: plainPassword,
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      const isValid = await user.verifyPassword(plainPassword);
      expect(isValid).toBe(true);
    }, 15000);

    test("should return false for incorrect password verification", async () => {
      const plainPassword = "CorrectPassword123!";
      const userData = {
        email: "wrongpass@example.com",
        password_hash: plainPassword,
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      const isValid = await user.verifyPassword("WrongPassword456!");
      expect(isValid).toBe(false);
    }, 15000);
  });

  describe("Unique Index on Email", () => {
    test("should prevent duplicate emails", async () => {
      const email = "duplicate@example.com";
      const userData = {
        email,
        password_hash: "Password123!",
        role: "student",
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      try {
        await user2.save();
        fail("Should have thrown a duplicate key error");
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    }, 15000);
  });

  describe("Timestamps", () => {
    test("should have created_at and updated_at fields", async () => {
      const userData = {
        email: "timestamp@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      expect(user.created_at instanceof Date).toBe(true);
    }, 15000);

    test("should update updated_at when modifying document", async () => {
      const userData = {
        email: "timestamp-update@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();
      const initialupdated_at = user.updated_at;

      await new Promise((resolve) => setTimeout(resolve, 100));
      user.is_active = false;
      await user.save();

      expect(user.updated_at).not.toEqual(initialupdated_at);
    }, 15000);
  });

  describe("Email Field", () => {
    test("should store email correctly", async () => {
      const email = "john@example.com";
      const userData = {
        email,
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      expect(user.email).toBe(email);
    });
  });

  describe("Password Hash Field", () => {
    test("should not select password_hash by default in queries", async () => {
      // This test verifies the select: false setting
      const userData = {
        email: "noselect@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();
      const userId = user._id;

      const foundUser = await User.findById(userId);
      expect(foundUser.password_hash).toBeUndefined();
    }, 15000);

    test("should select password_hash when explicitly requested", async () => {
      const userData = {
        email: "withselect@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();
      const userId = user._id;

      const foundUser = await User.findById(userId).select("+password_hash");
      expect(foundUser.password_hash).toBeDefined();
    }, 15000);
  });

  describe("Photo URL Field", () => {
    test("should store photo_url when provided", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        photo_url: "https://example.com/photo.jpg",
      };

      const user = new User(userData);
      expect(user.photo_url).toBe("https://example.com/photo.jpg");
    });
  });

  describe("Last Login Tracking", () => {
    test("should update last_login timestamp", async () => {
      const userData = {
        email: "lastlogin@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      };

      const user = new User(userData);
      await user.save();

      const now = new Date();
      user.last_login = now;
      await user.save();

      expect(user.last_login).toEqual(now);
    }, 15000);
  });

  describe("Email Verification", () => {
    test("should track email verification status", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        email_verified: true,
      };

      const user = new User(userData);
      expect(user.email_verified).toBe(true);
    });

    test("should track email verification timestamp", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "TestPassword123!",
        role: "student",
        email_verified: true,
      };

      const user = new User(userData);
      const now = new Date();
      user.email_verified_at = now;

      expect(user.email_verified_at).toEqual(now);
    });
  });
});
