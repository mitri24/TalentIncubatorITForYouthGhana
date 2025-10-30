/**
 * Base Service Class
 * 
 * Provides:
 * - Repository injection (no global imports)
 * - Centralized validation
 * - Transaction wrapper
 * - Error normalization
 * - Logging hooks
 * - Async local context (for future tracing)
 */

import { AsyncLocalStorage } from "async_hooks";

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * @abstract
 * @class BaseService
 */
class BaseService {
  /**
   * @param {Object} repositories - Injected repositories
   * @param {Object} [options] - Optional config
   * @param {boolean} [options.enableLogging=true]
   */
  constructor(repositories = {}, options = {}) {
    if (new.target === BaseService) {
      throw new Error("BaseService is abstract and cannot be instantiated directly");
    }

    this.repos = { ...repositories };
    this.options = {
      enableLogging: true,
      ...options,
    };

    // Bind context methods
    this.runInContext = this.runInContext.bind(this);
    this.getContext = this.getContext.bind(this);
  }

  // ========================================
  // 1. CONTEXT & TRACING
  // ========================================

  /**
   * Run a callback within async context (for request ID, user, etc.)
   * @param {Object} context - { requestId, userId, etc. }
   * @param {Function} callback - Async function
   * @returns {Promise<any>}
   */
  runInContext(context, callback) {
    return asyncLocalStorage.run(context, callback);
  }

  /**
   * Get current async context
   * @returns {Object|null}
   */
  getContext() {
    return asyncLocalStorage.getStore() || null;
  }

  // ========================================
  // 2. VALIDATION
  // ========================================

  /**
   * Validate input using attached Validation class
   * @param {Object} data
   * @param {import('joi').Schema} schema
   * @returns {Object} - Clean, validated data
   * @throws {Error} - Validation error
   */
  validate(data, schema) {
    if (!this.constructor.validation) {
      throw new Error("Validation class not attached. Use BaseService.setValidation()");
    }
    return this.constructor.validation.validate(data, schema);
  }

  /**
   * Attach validation class (once per app)
   * @param {any} validationClass
   */
  static setValidation(validationClass) {
    if (this.validation) {
      console.warn("Validation class already attached");
    }
    this.validation = validationClass;
  }

  // ========================================
  // 3. TRANSACTION HELPER
  // ========================================

  /**
   * Execute callback in transaction (uses first available repo with .transaction)
   * @param {Function} callback - Receives session
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const repoWithTx = Object.values(this.repos).find(
      (repo) => repo && typeof repo.transaction === "function"
    );

    if (!repoWithTx) {
      throw new Error("No repository with transaction support injected");
    }

    return await repoWithTx.transaction(callback);
  }

  // ========================================
  // 4. LOGGING & ERROR HANDLING
  // ========================================

  /**
   * Log action (customize per env)
   * @param {string} action
   * @param {Object} [meta]
   */
  log(action, meta = {}) {
    if (!this.options.enableLogging) return;

    const context = this.getContext() || {};
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.constructor.name,
      action,
      ...context,
      ...meta,
    };

    // Replace with Winston/Pino in production
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Normalize error response
   * @param {Error} error
   * @param {string} [fallbackMessage]
   * @returns {Object}
   */
  error(error, fallbackMessage = "Operation failed") {
    // eslint-disable-next-line no-undef
    const isDev = process.env.NODE_ENV !== "production";

    this.log("error", {
      message: error.message,
      stack: isDev ? error.stack : undefined,
    });

    // Hide internal details in production
    const message = error.message.includes("Validation failed")
      ? error.message
      : fallbackMessage;

    return {
      success: false,
      error: isDev ? error.message : message,
      ...(isDev && { stack: error.stack }),
    };
  }

  // ========================================
  // 5. UTILITY: REPOSITORY ACCESS
  // ========================================

  /**
   * Get repository by name
   * @param {string} name
   * @returns {any}
   */
  repo(name) {
    const repo = this.repos[name];
    if (!repo) {
      throw new Error(`Repository '${name}' not injected into ${this.constructor.name}`);
    }
    return repo;
  }
}

export default BaseService;