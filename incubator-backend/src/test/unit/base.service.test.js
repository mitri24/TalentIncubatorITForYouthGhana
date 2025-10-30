/**
 * JEST TESTING TUTORIAL - BaseService
 * 
 * Learn by example: Each section teaches a testing concept
 */

import BaseService from './BaseService';

// ============================================================================
// LESSON 1: MOCKING - Creating Fake Objects for Testing
// ============================================================================

/**
 * WHY MOCK?
 * - Tests should be fast (no real databases/APIs)
 * - Tests should be isolated (one thing at a time)
 * - Tests should be predictable (same result every time)
 * 
 * A mock is a fake version of a real object
 */

// Mock Validation - A simplified version for testing
class MockValidation {
  static validate(data, schema) {
    // In real code, this would use Joi or similar
    // Here, we just check a simple condition
    if (schema.isValid && !schema.isValid(data)) {
      throw new Error('Validation failed: Invalid data');
    }
    return data;
  }
}

// Mock Repository - Fake database operations
class MockRepository {
  // Fake transaction method
  async transaction(callback) {
    const session = { inTransaction: true };
    return await callback(session);
  }

  // Fake findById method
  async findById(id) {
    return { id, name: 'Test Entity' };
  }
}

// Concrete class for testing (BaseService is abstract)
class TestService extends BaseService {
  async getById(id) {
    const repo = this.repo('testRepo');
    return await repo.findById(id);
  }

  async createWithValidation(data, schema) {
    const validated = this.validate(data, schema);
    return this.success(validated);
  }
}

// ============================================================================
// LESSON 2: DESCRIBE & TEST - Organizing Your Tests
// ============================================================================

/**
 * describe() - Groups related tests together
 * test() or it() - Individual test case
 * 
 * Structure:
 * describe('What you're testing', () => {
 *   test('should do something specific', () => {
 *     // Your test code
 *   });
 * });
 */

describe('BaseService', () => {
  
  // ============================================================================
  // LESSON 3: SETUP & TEARDOWN - Before/After Hooks
  // ============================================================================
  
  /**
   * beforeEach() - Runs before EACH test
   * afterEach() - Runs after EACH test
   * beforeAll() - Runs once before ALL tests
   * afterAll() - Runs once after ALL tests
   * 
   * Use these to set up fresh state for each test
   */
  
  let testService;
  let mockRepo;

  beforeEach(() => {
    // Create fresh instances before each test
    // This ensures tests don't affect each other
    BaseService.validation = null;
    mockRepo = new MockRepository();
    testService = new TestService({ testRepo: mockRepo });
    
    // Mock console methods so they don't clutter test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  // ============================================================================
  // LESSON 4: BASIC ASSERTIONS - Testing Values
  // ============================================================================
  
  describe('TUTORIAL: Basic Assertions', () => {
    /**
     * ASSERTIONS check if something is true
     * 
     * Common matchers:
     * - expect(x).toBe(y) - Exact equality (===)
     * - expect(x).toEqual(y) - Deep equality (for objects/arrays)
     * - expect(x).toBeTruthy() - Truthy value
     * - expect(x).toBeFalsy() - Falsy value
     * - expect(x).toBeNull() - Is null
     * - expect(x).toBeUndefined() - Is undefined
     * - expect(x).toBeDefined() - Not undefined
     */
    
    test('EXAMPLE: toBe vs toEqual', () => {
      // toBe checks reference equality (same object)
      const obj1 = { name: 'Test' };
      const obj2 = { name: 'Test' };
      
      // This FAILS because they're different objects
      // expect(obj1).toBe(obj2); 
      
      // This PASSES because the content is the same
      expect(obj1).toEqual(obj2);
    });

    test('should validate service options', () => {
      // Create service with custom options
      const service = new TestService({}, { enableLogging: false });
      
      // Check the option was set correctly
      expect(service.options.enableLogging).toBe(false);
    });
  });

  // ============================================================================
  // LESSON 5: TESTING EXCEPTIONS - Expecting Errors
  // ============================================================================
  
  describe('TUTORIAL: Testing Errors', () => {
    /**
     * Use toThrow() to test if code throws an error
     * 
     * IMPORTANT: Wrap the code in a function!
     * expect(() => functionThatThrows()).toThrow()
     * NOT: expect(functionThatThrows()).toThrow() ❌
     */
    
    test('EXAMPLE: Testing errors', () => {
      // This function throws an error
      function throwError() {
        throw new Error('Something went wrong');
      }
      
      // Test that it throws
      expect(() => throwError()).toThrow();
      
      // Test the error message
      expect(() => throwError()).toThrow('Something went wrong');
    });

    test('should throw error when instantiated directly', () => {
      // BaseService is abstract, so direct instantiation should fail
      expect(() => new BaseService()).toThrow(
        'BaseService is abstract and cannot be instantiated directly'
      );
    });

    test('should throw if repository not found', () => {
      // Try to access a repository that doesn't exist
      expect(() => testService.repo('nonExistent')).toThrow(
        "Repository 'nonExistent' not injected into TestService"
      );
    });
  });

  // ============================================================================
  // LESSON 6: ASYNC TESTING - Testing Promises
  // ============================================================================
  
  describe('TUTORIAL: Async Testing', () => {
    /**
     * Three ways to test async code:
     * 1. async/await (easiest)
     * 2. return promise
     * 3. done callback (older style)
     * 
     * ALWAYS use async/await for modern code!
     */
    
    test('EXAMPLE: Testing async functions', async () => {
      // Use async/await in your test
      const result = await testService.getById(1);
      
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Entity');
    });

    test('EXAMPLE: Testing async errors', async () => {
      // Create a service without transaction support
      const serviceNoTx = new TestService({ repo: {} });
      
      // Use await expect(...).rejects for async errors
      await expect(
        serviceNoTx.transaction(async () => {})
      ).rejects.toThrow('No repository with transaction support injected');
    });

    test('should execute callback in transaction', async () => {
      // Call an async method
      const result = await testService.transaction(async (session) => {
        // Return something we can verify
        return { result: 'success', session };
      });
      
      // Check the result
      expect(result.result).toBe('success');
      expect(result.session.inTransaction).toBe(true);
    });
  });

  // ============================================================================
  // LESSON 7: SPIES & MOCKS - Tracking Function Calls
  // ============================================================================
  
  describe('TUTORIAL: Spies and Mocks', () => {
    /**
     * SPIES let you:
     * - Check if a function was called
     * - See what arguments it received
     * - Control what it returns
     * 
     * jest.spyOn(object, 'method') - Watch a method
     * jest.fn() - Create a mock function
     */
    
    test('EXAMPLE: Basic spy usage', () => {
      // We already spied on console.log in beforeEach
      // Now let's see if it was called
      
      testService.log('test-action', { userId: '123' });
      
      // Check if console.log was called
      expect(console.log).toHaveBeenCalled();
      
      // Check how many times
      expect(console.log).toHaveBeenCalledTimes(1);
      
      // Check what it was called with (partial match)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-action')
      );
    });

    test('EXAMPLE: Creating mock functions', () => {
      // Create a mock function
      const mockCallback = jest.fn((x) => x * 2);
      
      // Call it
      const result = mockCallback(5);
      
      // Check it was called and what it returned
      expect(mockCallback).toHaveBeenCalledWith(5);
      expect(result).toBe(10);
    });

    test('should log with service name and timestamp', () => {
      testService.log('test-action');

      // Get what console.log was called with
      const logCall = console.log.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      
      // Verify the log structure
      expect(parsed.service).toBe('TestService');
      expect(parsed.action).toBe('test-action');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  // ============================================================================
  // LESSON 8: TESTING WITH CONTEXT - AsyncLocalStorage
  // ============================================================================
  
  describe('TUTORIAL: Testing Context', () => {
    /**
     * When testing code that uses AsyncLocalStorage:
     * - Run your test inside runInContext()
     * - Check that context is available inside
     * - Verify context isolation between calls
     */
    
    test('EXAMPLE: Context isolation', async () => {
      const context1 = { requestId: '1' };
      const context2 = { requestId: '2' };

      // Run two operations in parallel with different contexts
      const [result1, result2] = await Promise.all([
        testService.runInContext(context1, async () => {
          // Simulate some async work
          await new Promise(resolve => setTimeout(resolve, 10));
          return testService.getContext().requestId;
        }),
        testService.runInContext(context2, async () => {
          return testService.getContext().requestId;
        })
      ]);

      // Each should maintain its own context
      expect(result1).toBe('1');
      expect(result2).toBe('2');
    });

    test('should include context in logs', async () => {
      const context = { requestId: 'req-123', userId: 'user-1' };

      // Run code inside a context
      await testService.runInContext(context, async () => {
        testService.log('test-action');
      });

      // Verify the context was included in the log
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('req-123')
      );
    });
  });

  // ============================================================================
  // LESSON 9: OBJECT MATCHERS - Flexible Assertions
  // ============================================================================
  
  describe('TUTORIAL: Object Matchers', () => {
    /**
     * Testing objects with flexible matchers:
     * - toHaveProperty(key, value) - Object has property
     * - toMatchObject(subset) - Object contains subset
     * - expect.objectContaining() - Partial object match
     * - expect.stringContaining() - Partial string match
     */
    
    test('EXAMPLE: Object matchers', () => {
      const user = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        createdAt: new Date()
      };
      
      // Check single property
      expect(user).toHaveProperty('name', 'John');
      
      // Check partial object
      expect(user).toMatchObject({
        id: 1,
        name: 'John'
      });
      
      // Check nested objects
      expect(user).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          createdAt: expect.any(Date)
        })
      );
    });

    test('should inject repositories', () => {
      const service = new TestService({ 
        repo1: { name: 'first' }, 
        repo2: { name: 'second' } 
      });
      
      // Check properties exist
      expect(service.repos).toHaveProperty('repo1');
      expect(service.repos).toHaveProperty('repo2');
      
      // Check structure
      expect(service.repos).toMatchObject({
        repo1: { name: 'first' }
      });
    });
  });

  // ============================================================================
  // LESSON 10: ENVIRONMENT & CONDITIONALS - Testing Different Scenarios
  // ============================================================================
  
  describe('TUTORIAL: Environment Testing', () => {
    /**
     * Test different environments by:
     * - Setting process.env variables
     * - Using different mock responses
     * - Testing conditional logic paths
     */
    
    test('EXAMPLE: Development vs Production', () => {
      // Test development behavior
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const devResult = testService.error(error);
      expect(devResult.stack).toBeDefined();
      
      // Test production behavior
      process.env.NODE_ENV = 'production';
      const prodResult = testService.error(error, 'Generic error');
      expect(prodResult.error).toBe('Generic error');
      expect(prodResult.stack).toBeUndefined();
    });

    test('should disable logging when option is false', () => {
      // Create service with logging disabled
      const service = new TestService({}, { enableLogging: false });
      
      service.log('test-action');
      
      // Console.log should NOT have been called
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // LESSON 11: INTEGRATION TESTS - Testing Multiple Features Together
  // ============================================================================
  
  describe('TUTORIAL: Integration Testing', () => {
    /**
     * Integration tests check that multiple components work together
     * - Use real (or realistic) data flow
     * - Test complete user scenarios
     * - Verify end-to-end behavior
     */
    
    test('EXAMPLE: Complete workflow', async () => {
      // Set up everything needed
      BaseService.setValidation(MockValidation);
      const context = { requestId: 'req-123', userId: 'user-1' };

      // Run a complete operation
      const result = await testService.runInContext(context, async () => {
        // 1. Validate data
        const data = { name: 'Test Product' };
        const schema = { isValid: () => true };
        const validated = testService.validate(data, schema);
        
        // 2. Run in transaction
        return await testService.transaction(async (session) => {
          // 3. Log the operation
          testService.log('create-product', { data: validated });
          
          // 4. Return success response
          return testService.success({ 
            ...validated, 
            sessionId: session.inTransaction 
          });
        });
      });

      // Verify the entire flow worked
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Product');
      expect(result.data.sessionId).toBe(true);
      
      // Verify logging happened with context
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('req-123')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('create-product')
      );
    });
  });

  // ============================================================================
  // LESSON 12: BEST PRACTICES - Writing Good Tests
  // ============================================================================
  
  describe('TUTORIAL: Best Practices', () => {
    /**
     * GOOD TEST PRACTICES:
     * 
     * 1. AAA Pattern: Arrange, Act, Assert
     * 2. Test one thing per test
     * 3. Use descriptive names
     * 4. Keep tests independent
     * 5. Don't test implementation details
     * 6. Test behavior, not code coverage
     */
    
    test('GOOD: Clear AAA pattern', async () => {
      // ARRANGE - Set up test data
      const userId = 123;
      
      // ACT - Execute the code being tested
      const result = await testService.getById(userId);
      
      // ASSERT - Verify the results
      expect(result.id).toBe(userId);
      expect(result).toHaveProperty('name');
    });

    test('GOOD: Descriptive test name explains what and why', () => {
      // Anyone reading this knows exactly what's being tested
      expect(testService.repo('testRepo')).toBe(mockRepo);
    });

    test('BAD EXAMPLE: Testing multiple unrelated things', () => {
      // ❌ Don't do this - test one thing per test
      expect(testService.options.enableLogging).toBe(true);
      expect(testService.repos).toBeDefined();
      expect(() => testService.repo('missing')).toThrow();
      // These should be 3 separate tests!
    });
  });
});

// ============================================================================
// QUICK REFERENCE CHEATSHEET
// ============================================================================

/**
 * JEST CHEATSHEET
 * 
 * STRUCTURE:
 * describe('Group', () => {})
 * test('case', () => {})
 * 
 * SETUP:
 * beforeEach(() => {})
 * afterEach(() => {})
 * 
 * MATCHERS:
 * expect(x).toBe(y)                    // ===
 * expect(x).toEqual(y)                 // Deep equal
 * expect(x).toBeTruthy()               // Boolean true
 * expect(x).toHaveProperty('key')      // Object property
 * expect(x).toMatchObject({...})       // Partial match
 * expect(() => fn()).toThrow()         // Throws error
 * 
 * ASYNC:
 * test('async', async () => {
 *   await expect(promise).resolves.toBe(x)
 *   await expect(promise).rejects.toThrow()
 * })
 * 
 * MOCKS:
 * jest.fn()                            // Mock function
 * jest.spyOn(obj, 'method')            // Spy on method
 * expect(fn).toHaveBeenCalled()        // Was called
 * expect(fn).toHaveBeenCalledWith(x)   // Called with arg
 * 
 * FLEXIBLE MATCHERS:
 * expect.any(Constructor)              // Any instance
 * expect.stringContaining('text')      // Partial string
 * expect.objectContaining({...})       // Partial object
 * expect.arrayContaining([...])        // Partial array
 */