/* eslint-disable no-undef */
/**
 * Unit tests for Student model
 * Tests schema validation, nested arrays (education, work_experience, skills), and defaults
 */

import Student from "../../modules/user/model/student.model";
import User from "../../modules/user/model/user.model";
import { connectDB, disconnectDB } from "../setup/setup.db";


describe("Student Model", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  afterEach(async () => {
    // Clean up database after each test
    await Student.deleteMany({});
    await User.deleteMany({});
  });

  describe("Schema Validation", () => {
    test("should create a student profile with required fields", async () => {
      // Create a user first
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(student.user).toEqual(user._id);
      expect(student.first_name).toBe("John");
      expect(student.last_name).toBe("Doe");
    });

    test("should require user reference", async () => {
      const studentData = {
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    test("should require first_name", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        last_name: "Doe",
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      console.log(error);
      expect(error).toBeDefined();
      expect(error.errors.first_name).toBeDefined();
    });

    test("should require last_name", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.last_name).toBeDefined();
    });

    test("should validate status enum values", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const invalidStatusData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        status: "invalid_status",
      };

      const student = new Student(invalidStatusData);
      const error = student.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test("should accept valid status values", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const statuses = ["active", "job_seeking", "inactive"];

      for (const status of statuses) {
        const studentData = {
          user: user._id,
          first_name: "John",
          last_name: "Doe",
          status,
        };

        const student = new Student(studentData);
        const error = student.validateSync();
        expect(error).toBeUndefined();
        expect(student.status).toBe(status);
      }
    });
  });

  describe("Default Values", () => {
    test("should have default status as active", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(student.status).toBe("active");
    });

    test("should have default bio as empty string", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(student.bio).toBe("");
    });

    test("should have default empty skills array", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(Array.isArray(student.skills)).toBe(true);
      expect(student.skills.length).toBe(0);
    });

    test("should have default empty education array", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(Array.isArray(student.education)).toBe(true);
      expect(student.education.length).toBe(0);
    });

    test("should have default empty work_experience array", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(Array.isArray(student.work_experience)).toBe(true);
      expect(student.work_experience.length).toBe(0);
    });
  });

  describe("Skills Array", () => {
    test("should add single skill", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        skills: ["JavaScript"],
      };

      const student = new Student(studentData);
      expect(student.skills).toContain("JavaScript");
      expect(student.skills.length).toBe(1);
    });

    test("should add multiple skills", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        skills: ["JavaScript", "Python", "React"],
      };

      const student = new Student(studentData);
      expect(student.skills.length).toBe(3);
      expect(student.skills).toEqual(["JavaScript", "Python", "React"]);
    });
  });

  describe("Education Array", () => {
    test("should add education entry with required fields", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const educationData = {
        school: "University of Ghana",
        qualification: "Bachelor",
        field_of_study: "Computer Science",
        start_date: new Date("2020-09-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        education: [educationData],
      };

      const student = new Student(studentData);
      expect(student.education.length).toBe(1);
      expect(student.education[0].school).toBe("University of Ghana");
      expect(student.education[0].qualification).toBe("Bachelor");
    });

    test("should require school in education entry", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const educationData = {
        qualification: "Bachelor",
        field_of_study: "Computer Science",
        start_date: new Date("2020-09-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        education: [educationData],
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      expect(error).toBeDefined();
    });

    test("should require qualification in education entry", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const educationData = {
        school: "University of Ghana",
        field_of_study: "Computer Science",
        start_date: new Date("2020-09-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        education: [educationData],
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      expect(error).toBeDefined();
    });

    test("should have default is_current as false", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const educationData = {
        school: "University of Ghana",
        qualification: "Bachelor",
        field_of_study: "Computer Science",
        start_date: new Date("2020-09-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        education: [educationData],
      };

      const student = new Student(studentData);
      expect(student.education[0].is_current).toBe(false);
    });

    test("should support multiple education entries", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const educationData = [
        {
          school: "University of Ghana",
          qualification: "Bachelor",
          field_of_study: "Computer Science",
          start_date: new Date("2020-09-01"),
          end_date: new Date("2024-06-01"),
          is_current: false,
        },
        {
          school: "Ashesi University",
          qualification: "Master",
          field_of_study: "Software Engineering",
          start_date: new Date("2024-09-01"),
          is_current: true,
        },
      ];

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        education: educationData,
      };

      const student = new Student(studentData);
      expect(student.education.length).toBe(2);
    });
  });

  describe("Work Experience Array", () => {
    test("should add work experience entry with required fields", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const experienceData = {
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Accra",
        start_date: new Date("2023-01-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        work_experience: [experienceData],
      };

      const student = new Student(studentData);
      expect(student.work_experience.length).toBe(1);
      expect(student.work_experience[0].title).toBe("Software Engineer");
    });

    test("should require title in work experience entry", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const experienceData = {
        company: "Tech Corp",
        location: "Accra",
        start_date: new Date("2023-01-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        work_experience: [experienceData],
      };

      const student = new Student(studentData);
      const error = student.validateSync();
      expect(error).toBeDefined();
    });

    test("should have default is_current as true", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const experienceData = {
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Accra",
        start_date: new Date("2023-01-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        work_experience: [experienceData],
      };

      const student = new Student(studentData);
      expect(student.work_experience[0].is_current).toBe(true);
    });

    test("should have default description as empty string", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const experienceData = {
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Accra",
        start_date: new Date("2023-01-01"),
      };

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        work_experience: [experienceData],
      };

      const student = new Student(studentData);
      expect(student.work_experience[0].description).toBe("");
    });
  });

  describe("Social Links", () => {
    test("should add social links", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const socialLinks = [
        { name: "GitHub", url: "https://github.com/johndoe" },
        { name: "LinkedIn", url: "https://linkedin.com/in/johndoe" },
      ];

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        social_links: socialLinks,
      };

      const student = new Student(studentData);
      expect(student.social_links.length).toBe(2);
      expect(student.social_links[0].name).toBe("GitHub");
    });
  });

  describe("Bio and CV", () => {
    test("should store bio", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        bio: "Passionate software developer",
      };

      const student = new Student(studentData);
      expect(student.bio).toBe("Passionate software developer");
    });

    test("should store cv_url", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
        cv_url: "https://example.com/cv.pdf",
      };

      const student = new Student(studentData);
      expect(student.cv_url).toBe("https://example.com/cv.pdf");
    });
  });

  describe("Timestamps", () => {
    test("should have created_at and updated_at fields", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      await student.save();

      expect(student.created_at).toBeDefined();
      expect(student.updated_at).toBeDefined();
    });
  });

  describe("User Reference", () => {
    test("should reference the correct user", async () => {
      const user = new User({
        email: "student@example.com",
        password_hash: "TestPassword123!",
        role: "student",
      });
      await user.save();

      const studentData = {
        user: user._id,
        first_name: "John",
        last_name: "Doe",
      };

      const student = new Student(studentData);
      expect(student.user).toEqual(user._id);
    });
  });
});
