## Repository: IT Youth Talent Incubator — backend

Purpose: Help AI coding agents become productive quickly by documenting the project's architecture, conventions, run/test flow, and key integration points.

- Entry point: `src/app.js` (Express). Development uses `npm run dev` (nodemon). Production start uses `npm run start` which runs `babel-node src/app.js`.
- Tests: `npm test` (Jest). Tests use `mongodb-memory-server` and `dotenv/config` (see `package.json` -> `jest.setupFiles`).

Architecture & conventions (what to follow)
- Feature-based modules live in `src/modules/<feature>` and typically expose these files: `model`, `repositories`, `service`, `validation`, `routes`.
- Naming and DI: Services extend `src/modules/shared/base.service.js` and expect repositories injected by name (e.g. `userRepository` is available as `this.repo('user')`). See `src/modules/user/service/user.service.js` for an example.
- Data access: Repositories extend `src/modules/shared/base.repository.js`. Preferred methods: `findById`, `findOne`, `findAll`, `create`, `update`, `delete`, `forceDelete`, `transaction`. Options commonly used: `lean`, `select`, `populate`, `includeDeleted`.
- Validation: Services use Joi-based validators attached via `BaseService.setValidation(...)`. Look at `src/modules/user/validation/user.validation.js` for pattern.
- Transactions: Use `service.transaction(callback)` which delegates to the first injected repo that supports transactions (Mongoose sessions).

Integration points & external deps
- MongoDB via Mongoose (models in `src/modules/**/model/*.js`). Use Mongoose sessions for transactions.
- Job queue: Agenda.js (dependency in `package.json`) — background jobs are queued and processed separately; look in `modules/*/jobs` or `modules/*/queue` for usage.
- File storage: Local disk + Nginx in deployment; file upload endpoints use Multer-like objects (see `user.service.uploadPhoto` placeholder).
- Auth: JWT configuration lives in `src/config/jwt.config.js`. Required environment variables include `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` (the code validates these in production). Use `.env` for local development.

Developer workflows & commands (concrete)
- Install: `npm ci` or `npm install`.
- Dev server: `npm run dev` (starts `nodemon`, hot reload). The app listens on `process.env.PORT || 3001`.
- Start (production-style): `npm run start` (uses `babel-node src/app.js` — ensure environment and Babel config are present).
- Build (optional): `npm run build` (produces `dist/` via Babel CLI).
- Tests: `npm test`. Unit and integration tests use Jest and `mongodb-memory-server` so they should run without an external MongoDB.
- Lint: `npm run lint` runs ESLint across `src` with `--fix` enabled.

Project-specific gotchas and notes for coding agents
- Logging: `winston` is listed in `package.json`, but `src/utils/logger.js` is currently empty — prefer existing `BaseService.log()` patterns and inspect `logs/` for runtime formats before adding new logger code.
- Avoid global imports in services — repositories are injected into services via the constructor. Follow the DI pattern used in `user.service.js`.
- Error handling: Services return normalized error objects using `BaseService.error(error, fallbackMessage)` — prefer that pattern for consistent API responses.
- Soft deletes: Repositories implement soft-delete semantics (fields like `deleted_at`). Use `includeDeleted` option where needed.
- Validation: Attach Joi validation to BaseService once at app startup. If creating a new service, create a `validation/*.js` file and call `BaseService.setValidation` where appropriate (see `user.service.js` header).

Files to consult when changing behavior
- `README.md` — architecture and deployment notes (diagrams in `docs/`)
- `package.json` — scripts and important dependencies (Agenda, Mongoose, Winston, Jest)
- `src/modules/shared/base.service.js` and `src/modules/shared/base.repository.js` — canonical service/repository contracts
- `src/config/jwt.config.js` — JWT secrets and production validation behavior
- `src/modules/user/service/user.service.js` — concrete example of logging, validation, transactions, and repo usage

If in doubt
- Reproduce patterns from `user.service.js` and shared base classes. Prefer small, incremental changes and include unit tests (Jest) for new behavior. For any change involving secrets or env vars, reference `src/config/jwt.config.js` and `README.md` deployment notes.

---
If you want, I can (1) merge this into an existing instructions file if you have one elsewhere, or (2) expand any section with more examples (service/repository templates, test skeletons).
