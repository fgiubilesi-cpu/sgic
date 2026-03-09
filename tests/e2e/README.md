# SGIC End-to-End Tests (Playwright)

Automated test suite for SGIC using Playwright.

## Setup

Tests are already configured in `playwright.config.ts`.

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
- T2.1: Login with valid credentials
- T2.2: Login error handling
- T2.3: Password validation
- T2.4: Logout functionality

### T3: Audit Workflow (audit-workflow.spec.ts)
- T3.1: Complete workflow (create → open → fill → verify)
- T3.2: Score calculation
- T3.3: Non-conformity auto-creation

### T4: Clients & Locations CRUD (clients-locations.spec.ts)
- T4.1: Create new client
- T4.2: Edit existing client
- T4.3: Create location under client
- T4.4: Delete location
- T4.5: View clients list

## Configuration

- **Base URL**: http://localhost:3000
- **Browsers**: Chrome, Firefox, Safari
- **Timeout**: 30 seconds (can be overridden)
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: On failure only
- **Traces**: On first retry

## Notes

- Tests require the app to be running (dev server starts automatically)
- Test data uses current timestamp for uniqueness
- Some selectors use data-testid attributes (add these to components for better reliability)
- Tests are robust to missing elements (use .catch() fallbacks)

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
