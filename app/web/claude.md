# Couchers.org Web Frontend - AI Assistant Guide

## Overview

This is the React/Next.js web frontend for Couchers.org. It provides the main user interface for the hospitality exchange platform.

**Technology Stack:**
- **Framework:** Next.js 15 (with Turbo mode)
- **UI Library:** React 18
- **Language:** TypeScript (strict mode)
- **Component Library:** Material UI (MUI) v7
- **Data Fetching:** TanStack Query (React Query) v5
- **Forms:** React Hook Form
- **Maps:** MapLibre GL, react-map-gl
- **Internationalization:** i18next, next-i18next
- **Styling:** Emotion (CSS-in-JS), MUI System
- **Testing:** Jest, React Testing Library
- **Package Manager:** Yarn 1.22.22
- **Node Version:** 22.x

## Project Structure

```
app/web/
├── components/          # Reusable UI components
├── features/           # Feature-specific code (organized by feature)
├── pages/              # Next.js pages (file-based routing)
├── public/             # Static assets
├── service/            # API service layer
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── proto/              # Generated Protocol Buffer types (from app/proto)
├── i18n/               # Internationalization config
├── markdown/           # Markdown content
├── cms/                # CMS content
├── test/               # Test utilities and setup
├── theme.ts            # MUI theme customization
├── routes.ts           # Route definitions
└── middleware.ts       # Next.js middleware
```

## Getting Started

### Prerequisites

- **Node.js:** v22.x (use nvm: `nvm install`)
- **Yarn:** `npm install --global yarn`
- **Protocol Buffers:** Generated types from `app/proto/`

### Quick Start (Frontend Only - Uses Staging Backend)

```bash
# Navigate to web directory
cd app/web

# Install Node.js v22
nvm install

# Install Yarn
npm install --global yarn

# Download pre-built Protocol Buffers
curl -sL https://develop--protos.preview.couchershq.org/ts.tar.gz | tar xz

# Install dependencies
yarn install

# Start development server
yarn start
```

Frontend will be available at http://localhost:3000

### Running with Local Backend

```bash
# Terminal 1: Generate protos and start backend
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
docker compose up

# Terminal 2: Start frontend with local config
cd app/web
cp .env.localdev .env.development
yarn start
```

## Development

### Available Scripts

- **`yarn start`** / **`yarn dev`** - Start development server (http://localhost:3000)
- **`yarn build`** - Build production bundle
- **`yarn serve`** - Serve production build locally
- **`yarn test`** - Run tests in watch mode
- **`yarn test-ci`** - Run all tests with coverage (for CI)
- **`yarn typecheck`** - Run TypeScript type checking
- **`yarn lint`** - Lint code
- **`yarn lint:fix`** - Auto-fix linting issues
- **`yarn format`** - Format code with Prettier
- **`yarn format:check`** - Check code formatting
- **`yarn knip`** - Find unused files, dependencies, and exports

### Authentication

- **Staging (next):** Create a real account, you'll receive signup emails
- **Local backend:** Use username `aapeli`, password `Aapeli's password`

**Note:** If you're logged out immediately after login, you may need to enable 3rd party cookies in your browser when using staging backend with localhost frontend.

## Code Organization

### Component Structure

Components are organized in two main ways:

1. **`components/`** - Shared, reusable components
   - Keep components generic and feature-agnostic
   - Should be usable across different features
   - Examples: Buttons, Cards, Layouts, Forms

2. **`features/`** - Feature-specific code
   - Organized by domain/feature area
   - May contain components, hooks, utils specific to that feature
   - Examples: auth, profile, messages, search

### State Management

- **Server State:** TanStack Query (React Query) for all API data
  - Automatic caching, refetching, and synchronization
  - Query keys defined per feature
  - Mutations for write operations

- **Client State:** React useState/useContext for UI state
  - Keep local state close to where it's used
  - Use context sparingly for truly global UI state

- **Form State:** React Hook Form
  - Handles form validation, errors, and submission
  - Integrates with MUI components

### API Communication

All backend communication uses **gRPC-Web** with **Protocol Buffers**.

**Service Layer Pattern:**
```typescript
// service/api.ts - API client setup
// features/[feature]/[feature]Service.ts - Feature-specific API calls
```

**Key Files:**
- **`service/api.ts`** - gRPC client configuration
- **`proto/`** - Auto-generated types from Protocol Buffers
- Feature-specific service files in each feature directory

**Regenerating Protos:**
```bash
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

## Styling

### MUI Theme

- **Theme definition:** `theme.ts`
- **Customization:** Extends MUI default theme with custom colors, typography, and component overrides
- **Usage:** Access via `useTheme()` hook or `sx` prop

### Styling Approaches

1. **MUI `sx` prop** (preferred for component-level styles)
   ```typescript
   <Box sx={{ p: 2, bgcolor: 'background.paper' }}>...</Box>
   ```

2. **Emotion styled components** (for reusable styled components)
   ```typescript
   const StyledBox = styled(Box)(({ theme }) => ({
     padding: theme.spacing(2),
   }));
   ```

3. **MUI's `styled` API** (alternative to Emotion)
   ```typescript
   import { styled } from '@mui/material/styles';
   ```

### Responsive Design

- Use MUI breakpoints: `xs`, `sm`, `md`, `lg`, `xl`
- Example: `sx={{ display: { xs: 'none', md: 'block' } }}`

## Internationalization (i18n)

### Setup
- **Library:** i18next with next-i18next
- **Config:** `next-i18next.config.js`, `i18n/` directory
- **Translation Platform:** Weblate (https://translate.couchershq.org/)

### Usage
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <div>{t('feature:key')}</div>;
}
```

### Translation Scripts
- **`yarn create-translation-files`** - Generate new translation files
- **`yarn delete-translation-files`** - Remove translation files

## Testing

### Test Structure
- **Unit tests:** Colocated with components (`ComponentName.test.tsx`)
- **Test utilities:** `test/` directory
- **Mocks:** `__mocks__/` directory

### Testing Stack
- **Test Runner:** Jest
- **React Testing:** React Testing Library
- **Mocking:** MSW (Mock Service Worker) for API mocking
- **User Interactions:** @testing-library/user-event

### Running Tests
```bash
# Watch mode (development)
yarn test

# CI mode (all tests with coverage)
yarn test-ci

# Update snapshots
yarn test -u
```

### Best Practices
- Test user behavior, not implementation
- Use `screen.getByRole()` over `getByTestId()`
- Mock API calls with MSW
- Keep tests focused and isolated

## Routing

### Next.js Pages Router
- File-based routing in `pages/` directory
- Dynamic routes: `[param].tsx`
- Route definitions centralized in `routes.ts`

### Navigation
```typescript
import { useRouter } from 'next/router';

const router = useRouter();
router.push('/path');
```

## Performance

### Optimization Techniques
- Code splitting via dynamic imports
- Image optimization with Next.js Image component
- React Query caching reduces unnecessary API calls
- Bundle analysis: Set `ANALYZE=true` when building

### Bundle Analysis
```bash
ANALYZE=true yarn build
```

## Environment Variables

Environment-specific configuration:
- **`.env.development`** - Default development (staging backend)
- **`.env.localdev`** - Local backend development
- **`.env.next`** - Next/staging environment
- **`.env.production`** - Production environment

**Key Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking
- Environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser

## Error Tracking

### Sentry Integration
- **Config:** `sentry.server.config.ts`, `sentry.edge.config.ts`
- **Dashboard:** https://couchers.sentry.io/
- Automatic error capture for unhandled exceptions
- Source maps uploaded for production builds

## Maps Integration

### MapLibre GL
- **Component:** `react-map-gl` wrapper around MapLibre
- **Usage:** Location display, search results, user locations
- **Architecture:** See `docs/architecture/frontend/map-search.md`

## Code Quality

### Linting
- **ESLint** with TypeScript support
- **Plugins:**
  - `@typescript-eslint`
  - `eslint-plugin-simple-import-sort` (import ordering)
  - `eslint-plugin-unused-imports`
  - `eslint-plugin-jsonc` (JSON linting)
- **Config:** `.eslintrc.json`

### Formatting
- **Prettier** for consistent code style
- **Config:** `.prettierrc` (empty = defaults)
- Auto-format on save (recommended in VS Code)

### Type Safety
- **TypeScript strict mode** enabled
- Type checking: `yarn typecheck`
- Generated types from Protocol Buffers

## Common Issues & Solutions

### Issue: Getting logged out after login
**Solution:** Enable 3rd party cookies in browser when using localhost with staging backend.

### Issue: Proto types not found
**Solution:** Regenerate Protocol Buffers:
```bash
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

### Issue: Dependencies out of sync
**Solution:**
```bash
rm -rf node_modules yarn.lock
yarn install
```

### Issue: Port 3000 already in use
**Solution:** Kill the process or use a different port:
```bash
PORT=3001 yarn start
```

## Contributing

### Before Submitting PR
1. Run type checking: `yarn typecheck`
2. Run linting: `yarn lint`
3. Run tests: `yarn test-ci`
4. Check formatting: `yarn format:check`

### PR Checklist
- [ ] Tests added/updated for new functionality
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Translations added if user-facing text changed
- [ ] Documentation updated if needed
- [ ] Tested in development environment
- [ ] Code reviewed and approved

### Branch Naming
Use format: `web/{type}/{description}`
- Examples: `web/feature/dark-mode`, `web/bug/login-redirect`

## Additional Resources

- **Main README:** `../../readme.md`
- **This module's README:** `readme.md`
- **Architecture docs:** `../../docs/architecture/`
- **Contributing guide:** `../../docs/contributing.md`
- **Material UI docs:** https://mui.com/material-ui/
- **Next.js docs:** https://nextjs.org/docs
- **TanStack Query docs:** https://tanstack.com/query/latest
- **React Hook Form docs:** https://react-hook-form.com/

## VS Code Setup (Recommended)

### Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner

### Settings
The `.vscode/` directory contains recommended settings. These enable:
- Auto-format on save
- ESLint auto-fix on save
- TypeScript language server features
