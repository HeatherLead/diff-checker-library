# Diff Checker Package

A React component library for inspecting, comparing, and synchronizing system configurations between source and target environments with live backend API integration.

## Installation

### From GitHub:
```bash
npm install git+https://github.com/ayushvc/diff-checker.git
```
*(or via GitHub Packages / private NPM registry)*

---

## Quick Start

### 1. In your application router (e.g., `/diff-checker`):

```jsx
import React from 'react';
import DiffChecker from 'diff-checker';
import 'diff-checker/style.css';

const DiffCheckerPage = () => {
  return (
    <DiffChecker base_url="https://tms-next-be.wcms.cloud" />
  );
};

export default DiffCheckerPage;
```

### 2. Setting up the Route in React Router (v6):

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiffCheckerPage from './pages/DiffCheckerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wildcard path ensures all sub-tabs like /diff-checker/task-entity match */}
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
| `base_url` | `string \| object` | `"https://tms-next-be.wcms.cloud"` | Base URL of the backend API. Can also accept `{ src_url, target_url }`. |
| `base_path` / `basePath` | `string` | `"/diff-checker"` | Base route path where the component is mounted in the parent app. |
| `synced_by` | `string` | `"ayush"` | User identifier passed in sync / clone requests. |
| `headers` | `object` | `{}` | Optional custom HTTP headers (e.g. `Authorization`) for API requests. |
| `initialOption` | `string` | `"datatables"` | Default active option ID on mount. |
| `initialOptionLabel` | `string` | `"DataTables"` | Default active option label. |

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

- **Get Configuration**: `GET {base_url}/api/get-configuration?diff_tag={diff_tag}`
- **Sync Configuration**: `PATCH {target_url}/api/sync-configuration`
- **Clone Configuration**: `POST {target_url}/api/clone-configuration`

---

## Development & Building

```bash
# Start development server
npm run dev

# Build package library (outputs to dist/)
npm run build
```
