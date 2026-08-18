# @ayushvc/diff-checker

A configurable React component library for inspecting, comparing, and synchronizing system configurations between source and target environments with live backend API integration.

---

## Installation

### Method 1: Via GitHub Packages (Recommended)

GitHub Packages delivers the optimized, pre-built bundle directly from the registry.

#### 1. Configure `.npmrc` in your project root:
Create or add to your project's `.npmrc` file:
```ini
@ayushvc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```
> Replace `YOUR_GITHUB_TOKEN` with a GitHub Personal Access Token (PAT) that has `read:packages` scope.

#### 2. Install the package:
```bash
npm install @ayushvc/diff-checker@latest
```

---

### Method 2: Directly via Git URL

You can also install directly from the GitHub repository:
```bash
npm install github:ayushvc/diff-checker
# or
npm install git+https://github.com/ayushvc/diff-checker.git
```
*(The package includes a `prepare` lifecycle script that automatically compiles the `dist/` directory on install).*

---

## Quick Start

### 1. Import and Mount Component

```jsx
import React from 'react';
import { DiffChecker } from '@ayushvc/diff-checker';
import '@ayushvc/diff-checker/style.css';

export default function TestDiffChecker() {
  const csrfToken = sessionStorage.getItem('x-csrf-token');

  return (
    <DiffChecker
      base_url={configs["backend_url"]}
      base_path="/test-diff-checker"
      csrf_token={csrfToken}
    />
  );
}
```

### 2. Set Up React Router (v6)

Use a wildcard route (`/*`) so that all sub-navigation tabs (DataTables, Task Entity, Dropdown Config, etc.) are handled seamlessly:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiffCheckerPage from './pages/DiffCheckerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/diff-checker/*" element={<DiffCheckerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `base_url` | `string` | `""` | Backend API host URL used to fetch configurations (`GET {base_url}/api/get-configuration?diff_tag=...`). |
| `base_path` / `basePath` | `string` | `"/diff-checker"` | Base route path where the DiffChecker is mounted. |
| `csrf_token` | `string` | `""` | CSRF token automatically sent in request headers (`'x-csrf-token': csrf_token`). |
| `synced_by` | `string` | `""` | User identifier included in sync and clone request payloads. |
| `headers` | `object` | `{}` | Custom HTTP headers (e.g. `Authorization`) forwarded in API requests. |
| `initialOption` | `string` | `"datatables"` | Default active option ID on initial load. |
| `initialOptionLabel` | `string` | `"DataTables"` | Default active option label. |

---

## Features & Confirmation Dialogs

- **Data Diff Table**: Compare configurations side-by-side between Source and Target environments with diff highlighting.
- **Sync Confirmation Dialog**: Confirm and swap sync direction with validation (typing `"yes"`) before executing `PATCH /api/sync-configuration`.
- **Copy to Right / Left (Clone) Dialog**: Confirm cloning configurations with source $\rightarrow$ target direction flow and validation before executing `POST /api/clone-configuration`.
- **Data Viewer Modal**: Full formatted JSON tree / raw view of site configurations.
- **Dynamic Search & Filtering**: Per-column search and dynamic multi-column filter bars.

---

## Available Sub-routes

When mounted with `base_path="/diff-checker"`:
- `/diff-checker` &rarr; DataTables Configuration
- `/diff-checker/task-entity` &rarr; Task Entity
- `/diff-checker/master-config` &rarr; Master Config
- `/diff-checker/site-config` &rarr; Site Config
- `/diff-checker/dropdown-config` &rarr; Dropdown Config
- `/diff-checker/permission-config` &rarr; Permission Config
- `/diff-checker/workflow-config` &rarr; WorkFlow Config
- `/diff-checker/attachment-tag-list` &rarr; Attachment Tag List
- `/diff-checker/templates` &rarr; Templates
- `/diff-checker/subtask-master` &rarr; SubTask Master
- `/diff-checker/custom-form` &rarr; Custom Form
- `/diff-checker/role-department-list` &rarr; Role Department List
- `/diff-checker/drupal-roles` &rarr; Drupal Roles
- `/diff-checker/react-menus` &rarr; React Menus

---

## Live API Endpoints

1. **Fetch Configuration**:
   ```http
   GET {base_url}/api/get-configuration?diff_tag={diff_tag}
   ```
2. **Sync Configuration**:
   ```http
   PATCH {target_url}/api/sync-configuration
   ```
3. **Clone Configuration (Copy to Right / Left)**:
   ```http
   POST {target_url}/api/clone-configuration
   ```

---

## Publishing to GitHub Packages (Maintainers)

### 1. Authenticate with GitHub Packages:
```bash
npm login --registry=https://npm.pkg.github.com --scope=@ayushvc
```
- **Username**: `ayushvc`
- **Password**: GitHub Personal Access Token (PAT) with `write:packages`, `read:packages`, and `repo` scopes.

### 2. Publish:
```bash
npm publish
```
*(The `prepublishOnly` script will automatically compile the bundle to `dist/` before publishing).*

---

## Development

```bash
# Start local development server
npm run dev

# Build library bundle
npm run build
```
