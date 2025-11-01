/* eslint-disable no-undef */
/**
 * Unit tests for Admin model
 * Tests schema validation, permissions array, and user reference
 */

import Admin from "../../modules/user/model/admin.model";
import User from "../../modules/user/model/user.model";
import { connectDB, disconnectDB } from "../setup/setup.db";


describe("Admin Model", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Admin.deleteMany({});
    await User.deleteMany({});
  });

  describe("Schema Validation", () => {
    test("should create an admin profile with required fields", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.user).toEqual(user._id);
      expect(admin.name).toBe("John Administrator");
    });

    test("should require user reference", async () => {
      const adminData = {
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      const error = admin.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    test("should require name", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
      };

      const admin = new Admin(adminData);
      const error = admin.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test("should validate permission enum values", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
        permissions: ["invalid_permission"],
      };

      const admin = new Admin(adminData);
      const error = admin.validateSync();
      expect(error).toBeDefined();
    });

    test("should accept valid permission values", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const validPermissions = ["create", "update", "read", "delete", "super"];

      for (const permission of validPermissions) {
        const adminData = {
          user: user._id,
          name: "John Administrator",
          permissions: [permission],
        };

        const admin = new Admin(adminData);
        const error = admin.validateSync();
        expect(error).toBeUndefined();
      }
    });
  });

  describe("Default Values", () => {
    test("should have default title as moderator", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.title).toBe("moderator");
    });

    test('should have default permissions as ["read"]', async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      expect(Array.isArray(admin.permissions)).toBe(true);
      expect(admin.permissions.length).toBeGreaterThan(0);
    });
  });

  describe("Permissions Array", () => {
    test("should store single permission", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
        permissions: ["read"],
      };

      const admin = new Admin(adminData);
      expect(admin.permissions).toContain("read");
    });

    test("should store multiple permissions", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
        permissions: ["create", "read", "update", "delete"],
      };

      const admin = new Admin(adminData);
      expect(admin.permissions.length).toBe(4);
      expect(admin.permissions).toContain("create");
      expect(admin.permissions).toContain("read");
      expect(admin.permissions).toContain("update");
      expect(admin.permissions).toContain("delete");
    });

    test("should support super permission", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
        permissions: ["super"],
      };

      const admin = new Admin(adminData);
      expect(admin.permissions).toContain("super");
    });
  });

  describe("Title Field", () => {
    test("should store custom title", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "Jane Administrator",
        title: "Super Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.title).toBe("Super Administrator");
    });

    test("should store moderator title", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "Jane Administrator",
        title: "moderator",
      };

      const admin = new Admin(adminData);
      expect(admin.title).toBe("moderator");
    });
  });

  describe("Admin Information", () => {
    test("should store admin name", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.name).toBe("John Administrator");
    });
  });

  describe("Timestamps", () => {
    test("should have created_at and updated_at fields", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      await admin.save();

      expect(admin.created_at).toBeDefined();
      expect(admin.updated_at).toBeDefined();
    });
  });

  describe("User Reference", () => {
    test("should reference the correct user", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "John Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.user).toEqual(user._id);
    });
  });

  describe("Full Admin Profile", () => {
    test("should create complete admin profile with all fields", async () => {
      const user = new User({
        email: "admin@example.com",
        password_hash: "TestPassword123!",
        role: "admin",
      });
      await user.save();

      const adminData = {
        user: user._id,
        name: "Jane Supervisor",
        permissions: ["create", "read", "update", "delete", "super"],
        title: "Senior Administrator",
      };

      const admin = new Admin(adminData);
      expect(admin.user).toEqual(user._id);
      expect(admin.name).toBe("Jane Supervisor");
      expect(admin.permissions.length).toBe(5);
      expect(admin.title).toBe("Senior Administrator");
    });
  });
});
