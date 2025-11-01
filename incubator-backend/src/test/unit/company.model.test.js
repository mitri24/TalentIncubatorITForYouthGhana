/* eslint-disable no-undef */
/**
 * Unit tests for Company model
 * Tests schema validation, user reference, and profile fields
 */

import Company from "../../modules/user/model/company.model";
import User from "../../modules/user/model/user.model";
import { connectDB, disconnectDB } from "../setup/setup.db";


describe("Company Model", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Company.deleteMany({});
    await User.deleteMany({});
  });

  describe("Schema Validation", () => {
    test("should create a company profile with required fields", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.user).toEqual(user._id);
      expect(company.name).toBe("Tech Solutions Ltd");
      expect(company.description).toBe(
        "A leading software development company"
      );
      expect(company.industry).toBe("Information Technology");
    });

    test("should require user reference", async () => {
      const companyData = {
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      const error = company.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    test("should require name", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      const error = company.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test("should require description", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      const error = company.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    test("should require industry", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
      };

      const company = new Company(companyData);
      const error = company.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.industry).toBeDefined();
    });
  });

  describe("Default Values", () => {
    test("should have default website as empty string", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.website).toBe("");
    });

    test("should have default empty social_links array", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(Array.isArray(company.social_links)).toBe(true);
      expect(company.social_links.length).toBe(0);
    });
  });

  describe("Website Field", () => {
    test("should store website URL", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
        website: "https://techsolutions.com",
      };

      const company = new Company(companyData);
      expect(company.website).toBe("https://techsolutions.com");
    });
  });

  describe("Social Links", () => {
    test("should add single social link", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
        social_links: [
          {
            name: "LinkedIn",
            url: "https://linkedin.com/company/techsolutions",
          },
        ],
      };

      const company = new Company(companyData);
      expect(company.social_links.length).toBe(1);
      expect(company.social_links[0].name).toBe("LinkedIn");
    });

    test("should add multiple social links", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
        social_links: [
          {
            name: "LinkedIn",
            url: "https://linkedin.com/company/techsolutions",
          },
          { name: "Twitter", url: "https://twitter.com/techsolutions" },
          { name: "GitHub", url: "https://github.com/techsolutions" },
        ],
      };

      const company = new Company(companyData);
      expect(company.social_links.length).toBe(3);
    });
  });

  describe("Company Information", () => {
    test("should store company name", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.name).toBe("Tech Solutions Ltd");
    });

    test("should store company description", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const description =
        "A leading software development company in West Africa";
      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description,
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.description).toBe(description);
    });

    test("should store company industry", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.industry).toBe("Information Technology");
    });
  });

  describe("Timestamps", () => {
    test("should have created_at and updated_at fields", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      await company.save();

      expect(company.created_at).toBeDefined();
      expect(company.updated_at).toBeDefined();
    });
  });

  describe("User Reference", () => {
    test("should reference the correct user", async () => {
      const user = new User({
        email: "company@example.com",
        password_hash: "TestPassword123!",
        role: "company",
      });
      await user.save();

      const companyData = {
        user: user._id,
        name: "Tech Solutions Ltd",
        description: "A leading software development company",
        industry: "Information Technology",
      };

      const company = new Company(companyData);
      expect(company.user).toEqual(user._id);
    });
  });
});
