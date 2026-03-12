# SGIC End-to-End Tests (Playwright)

Automated test suite for SGIC using Playwright.

## Setup

Tests are already configured in `playwright.config.ts`.

Authenticated suites require these env vars:

```bash
export E2E_EMAIL="your-user@example.com"
export E2E_PASSWORD="your-password"
```

Optional:

```bash
export E2E_BASE_URL="http://localhost:3000"
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (with inspector)
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test
npx playwright test -g "User can login"
```

## Test Coverage

### T2: Authentication (auth.spec.ts)
- Login with configured credentials
- Validation on invalid email

### T3: Audit Workflow (audit-workflow.spec.ts)
- Audit explorer smoke

### T4: Clients & Locations CRUD (clients-locations.spec.ts)
- Clients explorer smoke
- Access to client workspace

### T5: Client document workspace (document-workspace.spec.ts)
- Access to client document tab
- Presence of archive controls and operational presets

### T6: Template workflows (templates.spec.ts)
- Template library smoke
- Import Excel sheet entry point
- New template editor smoke
- Audit template tab smoke

## Configuration

- **Base URL**: http://localhost:3000
- **Browsers**: Chrome, Firefox, Safari
- **Timeout**: 30 seconds (can be overridden)
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: On failure only
- **Traces**: On first retry

## Notes

- Tests reuse an existing local server when available, otherwise start `npm run dev:3000`
- Authenticated suites are skipped automatically if `E2E_EMAIL` / `E2E_PASSWORD` are not set
- Selectors are aligned to the current production UI copy to reduce drift

## Debugging

View HTML report after test run:
```bash
npx playwright show-report
```

Visual debugging:
```bash
npx playwright test --debug
```

Test filters:
```bash
# Run only failed tests
npx playwright test --last-failed
```
