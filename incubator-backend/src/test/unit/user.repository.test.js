/* eslint-disable no-undef */
import userRepository from "../../modules/user/repositories/user.repository";
import { ERROR_MESSAGES } from "../../utils/constants";
import { clearDB, connectDB, disconnectDB } from "../setup/setup.db";

describe("User Repository", () => {
  beforeAll(async () => {
    // Connect to a test database
    await connectDB();
  });
  afterAll(async () => {
    // Close DB connection
    await disconnectDB();
  });

  afterEach(async () => {
    // Clear collections after each test
    await clearDB();
  });

  describe("createUser", () => {
    test("should create a new user with valid data", async () => {
      const userData = {
        email: "newuser@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const user = await userRepository.createUser(userData);

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe("student");
      expect(user.status).toBe("pending");
      expect(user.is_active).toBe(true);
    }, 15000);

    test("should throw error if email is missing", async () => {
      const userData = {
        password_hash: "Password123!",
        role: "student",
      };

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
      );
    });

    test("should throw error if password_hash is missing", async () => {
      const userData = {
        email: "test@example.com",
        role: "student",
      };

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
      );
    });

    test("should throw error if role is missing", async () => {
      const userData = {
        email: "test@example.com",
        password_hash: "Password123!",
      };

      await expect(userRepository.createUser(userData)).rejects.toThrow(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
      );
    });

    test("should set default status as pending if not provided", async () => {
      const userData = {
        email: "statustest@example.com",
        password_hash: "Password123!",
        role: "company",
      };

      const user = await userRepository.createUser(userData);

      expect(user.status).toBe("pending");
    }, 15000);

    test("should set default is_active as true if not provided", async () => {
      const userData = {
        email: "activetest@example.com",
        password_hash: "Password123!",
        role: "admin",
      };

      const user = await userRepository.createUser(userData);

      expect(user.is_active).toBe(true);
    }, 15000);

    test("should respect provided status value", async () => {
      const userData = {
        email: "customstatus@example.com",
        password_hash: "Password123!",
        role: "student",
        status: "approved",
      };

      const user = await userRepository.createUser(userData);

      expect(user.status).toBe("approved");
    }, 15000);

    test("should respect provided is_active value", async () => {
      const userData = {
        email: "inactiveuser@example.com",
        password_hash: "Password123!",
        role: "student",
        is_active: false,
      };

      const user = await userRepository.createUser(userData);

      expect(user.is_active).toBe(false);
    }, 15000);

    test("should throw error if email is duplicate", async () => {
      const userData = {
        email: "duplicate@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      await userRepository.createUser(userData);

      await expect(userRepository.createUser(userData)).rejects.toThrow();
    }, 15000);
  });

  describe("findById", () => {
    test("should find user by id", async () => {
      const userData = {
        email: "findbyid@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const createdUser = await userRepository.createUser(userData);
      const foundUser = await userRepository.findById(createdUser._id);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser._id.toString()).toBe(createdUser._id.toString());
    }, 15000);

    test("should return null if user not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const user = await userRepository.findById(fakeId);

      expect(user).toBeNull();
    });

    test("should support lean option for better performance", async () => {
      const userData = {
        email: "leantest@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const createdUser = await userRepository.createUser(userData);
      const foundUser = await userRepository.findById(createdUser._id, {
        lean: true,
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
    }, 15000);
  });

  describe("findByEmail", () => {
    test("should find user by email address", async () => {
      const email = "findbyemail@example.com";
      const userData = {
        email,
        password_hash: "Password123!",
        role: "company",
      };

      await userRepository.createUser(userData);
      const foundUser = await userRepository.findByEmail(email);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(email);
    }, 15000);

    test("should return null if email not found", async () => {
      const user = await userRepository.findByEmail("nonexistent@example.com");

      expect(user).toBeNull();
    });

    test("should exclude fields by default", async () => {
      const email = "excludefields@example.com";
      const userData = {
        email,
        password_hash: "Password123!",
        role: "student",
      };

      await userRepository.createUser(userData);
      const foundUser = await userRepository.findByEmail(email);

      expect(foundUser.email).toBe(email);
      expect(foundUser.photo_url).toBeUndefined();
    }, 15000);

    test("should include password_hash when explicitly requested", async () => {
      const email = "passwordfield@example.com";
      const userData = {
        email,
        password_hash: "Password123!",
        role: "student",
      };

      await userRepository.createUser(userData);
      const foundUser = await userRepository.findByEmail(email, {
        select: "+password_hash",
      });

      expect(foundUser.password_hash).toBeDefined();
      expect(foundUser.password_hash.startsWith("$2b$")).toBe(true);
    }, 15000);
  });

  describe("verifyCredentials", () => {
    test("should verify valid credentials", async () => {
      const email = "verify@example.com";
      const plainPassword = "CorrectPassword123!";
      const userData = {
        email,
        password_hash: plainPassword,
        role: "student",
      };

      await userRepository.createUser(userData);
      const user = await userRepository.verifyCredentials(email, plainPassword);

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    }, 15000);

    test("should return null if email does not exist", async () => {
      const user = await userRepository.verifyCredentials(
        "nonexistent@example.com",
        "AnyPassword123!"
      );

      expect(user).toBeNull();
    });

    test("should return null if password is incorrect", async () => {
      const email = "wrongpass@example.com";
      const userData = {
        email,
        password_hash: "CorrectPassword123!",
        role: "student",
      };

      await userRepository.createUser(userData);
      const user = await userRepository.verifyCredentials(
        email,
        "WrongPassword456!"
      );

      expect(user).toBeNull();
    }, 15000);
  });

  describe("deleteUser", () => {
    test("should soft delete a user", async () => {
      const userData = {
        email: "deletes@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const createdUser = await userRepository.createUser(userData);
      await userRepository.deleteUser(createdUser._id);

      const deletedUser = await userRepository.findById(createdUser._id, {
        includeDeleted: true,
      });
      expect(deletedUser.deleted_at).toBeDefined();
    }, 15000);

    test("should return deleted user object", async () => {
      const userData = {
        email: "deletereturn@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const createdUser = await userRepository.createUser(userData);
      const result = await userRepository.deleteUser(createdUser._id);

      expect(result._id.toString()).toBe(createdUser._id.toString());
      expect(result.deleted_at).toBeDefined();
    }, 15000);
  });

  describe("restoreUser", () => {
    test("should restore a soft-deleted user", async () => {
      const userData = {
        email: "restore@example.com",
        password_hash: "Password123!",
        role: "student",
      };

      const createdUser = await userRepository.createUser(userData);
      await userRepository.deleteUser(createdUser._id);

      const restoredUser = await userRepository.restoreUser(createdUser._id);

      expect(restoredUser.deleted_at).toBeNull();
    }, 15000);
  });

  describe("getEligibleUsers", () => {
    test("should return only approved and active users", async () => {
      // Create various users
      await userRepository.createUser({
        email: "approved@example.com",
        password_hash: "Password123!",
        role: "student",
        status: "approved",
        is_active: true,
      });

      await userRepository.createUser({
        email: "pending@example.com",
        password_hash: "Password123!",
        role: "student",
        status: "pending",
        is_active: true,
      });

      await userRepository.createUser({
        email: "inactive@example.com",
        password_hash: "Password123!",
        role: "student",
        status: "approved",
        is_active: false,
      });

      const eligibleUsers = await userRepository.getEligibleUsers();

      const approvedActiveUsers = eligibleUsers.filter(
        (u) => u.status === "approved" && u.is_active === true && !u.deleted_at
      );

      expect(approvedActiveUsers.length).toBeGreaterThan(0);
      expect(
        eligibleUsers.every(
          (u) => u.status === "approved" && u.is_active === true
        )
      ).toBe(true);
    }, 15000);
  });

  describe("searchUsers", () => {
    test("should search users by email", async () => {
      await userRepository.createUser({
        email: "search@example.com",
        password_hash: "Password123!",
        role: "student",
      });

      const result = await userRepository.searchUsers("search@example");

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.total).toBeGreaterThan(0);
    }, 15000);

    test("should support pagination", async () => {
      // Create multiple users
      await userRepository.createUser({
        email: `example@test.com`,
        password_hash: "Password123!",
        role: "student",
      });

      const result = await userRepository.searchUsers("example", 1, 5);

      expect(result.metadata.page).toBe(1);
      expect(result.metadata.limit).toBe(5);
      expect(result.metadata.pages).toBeDefined();
    }, 15000);

    test("should return empty result for non-matching term", async () => {
      const result = await userRepository.searchUsers(
        "zzznonexistentzzzz",
        1,
        10
      );

      expect(result.data.length).toBe(0);
      expect(result.metadata.total).toBe(0);
    });

    test("should include metadata in response", async () => {
      // Create multiple users
      for (let i = 0; i < 8; i++) {
        await userRepository.createUser({
          email: `example${i}@test.com`,
          password_hash: "Password123!",
          role: "student",
        });
      }

      const result = await userRepository.searchUsers("example", 1, 10);

      expect(result.metadata).toHaveProperty("page");
      expect(result.metadata).toHaveProperty("limit");
      expect(result.metadata).toHaveProperty("total");
      expect(result.metadata).toHaveProperty("pages");
    });
  });
});
