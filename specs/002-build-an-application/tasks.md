# Tasks: Issue Tracking Application

**Input**: Design documents from `/specs/002-build-an-application/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure decision: Single React project with `src/` at repository root

## Phase 3.1: Setup

- [x] T001 Create project structure: src/{components,pages,hooks,services,types,utils}, src/components/{ui,features}, tests/{unit,integration,e2e}
- [x] T002 Install additional dependencies: react-router-dom, @dnd-kit/core, @dnd-kit/sortable, lucide-react, tailwindcss
- [x] T003 [P] Configure Tailwind CSS with PostCSS config
- [x] T004 [P] Configure Vitest testing environment with React Testing Library
- [x] T005 [P] Setup ESLint config with TypeScript strict rules and React hooks
- [x] T006 [P] Configure Prettier with project coding standards
- [x] T007 [P] Setup Husky pre-commit hooks with lint-staged

## Phase 3.2: Database Setup

- [x] T008 Create Supabase database schema: user_profiles, issues, workflow_steps, comments, notifications tables
- [x] T009 [P] Setup Row Level Security policies for all tables
- [x] T010 [P] Create database indexes for performance optimization
- [x] T011 [P] Configure Drizzle ORM schema definitions in src/lib/database/schema.ts

## Phase 3.3: Type Definitions & Validation

- [x] T012 [P] Create TypeScript interfaces in src/types/auth.ts
- [x] T013 [P] Create TypeScript interfaces in src/types/issues.ts
- [x] T014 [P] Create TypeScript interfaces in src/types/comments.ts
- [x] T015 [P] Create TypeScript interfaces in src/types/notifications.ts
- [x] T016 [P] Create Zod validation schemas in src/lib/validations/auth.ts
- [x] T017 [P] Create Zod validation schemas in src/lib/validations/issues.ts
- [x] T018 [P] Create Zod validation schemas in src/lib/validations/comments.ts

## Phase 3.4: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.5

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [x] T019 [P] Contract test GET /api/issues in tests/integration/issues-api.test.ts
- [x] T020 [P] Contract test POST /api/issues in tests/integration/issues-api.test.ts
- [x] T021 [P] Contract test PATCH /api/issues/:id/status in tests/integration/issues-api.test.ts
- [x] T022 [P] Contract test GET /api/issues/:id/comments in tests/integration/comments-api.test.ts
- [x] T023 [P] Contract test POST /api/issues/:id/comments in tests/integration/comments-api.test.ts
- [x] T024 [P] Contract test PATCH /api/notifications/:id/read in tests/integration/notifications-api.test.ts
- [x] T025 [P] Contract test Supabase authentication flow in tests/integration/auth-api.test.ts

### Component Tests

- [x] T026 [P] Test IssueCard component rendering and interactions in tests/unit/components/IssueCard.test.tsx
- [x] T027 [P] Test KanbanBoard drag-and-drop functionality in tests/unit/components/KanbanBoard.test.tsx
- [x] T028 [P] Test IssuesList filtering and sorting in tests/unit/components/IssuesList.test.tsx
- [x] T029 [P] Test CreateIssueForm validation in tests/unit/components/CreateIssueForm.test.tsx
- [x] T030 [P] Test CommentThread real-time updates in tests/unit/components/CommentThread.test.tsx

### Integration Tests

- [x] T031 [P] Integration test complete issue workflow (create → dev → qa → pm → resolved) in tests/integration/issue-workflow.test.ts
- [x] T032 [P] Integration test role-based permissions and workflow transitions in tests/integration/role-permissions.test.ts
- [x] T033 [P] Integration test real-time notifications system in tests/integration/notifications.test.ts
- [x] T034 [P] Integration test comment system with mentions in tests/integration/comments.test.ts

## Phase 3.5: Core Implementation (ONLY after tests are failing)

### Authentication & User Management

- [x] T035 [P] Supabase client configuration in src/lib/supabase.ts
- [x] T036 [P] Authentication service with sign up/in/out in src/services/auth.service.ts
- [x] T037 [P] User profile service for role management in src/services/user.service.ts
- [x] T038 [P] Auth hook for authentication state in src/hooks/useAuth.ts
- [x] T039 [P] Protected route component in src/components/auth/ProtectedRoute.tsx

### State Management

- [ ] T040 [P] Zustand auth store in src/stores/auth.store.ts
- [ ] T041 [P] Zustand notifications store in src/stores/notifications.store.ts
- [ ] T042 [P] TanStack Query configuration in src/lib/queryClient.ts
- [ ] T043 [P] Issues query hooks in src/hooks/queries/useIssues.ts
- [ ] T044 [P] Comments query hooks in src/hooks/queries/useComments.ts
- [ ] T045 [P] Notifications query hooks in src/hooks/queries/useNotifications.ts

### Core Services

- [ ] T046 [P] Issues service with CRUD operations in src/services/issues.service.ts
- [ ] T047 [P] Comments service with threading in src/services/comments.service.ts
- [ ] T048 [P] Notifications service with real-time subscriptions in src/services/notifications.service.ts
- [ ] T049 [P] Workflow service for status transitions in src/services/workflow.service.ts

### UI Components - Base

- [ ] T050 [P] Button component with variants in src/components/ui/Button.tsx
- [ ] T051 [P] Input component with validation states in src/components/ui/Input.tsx
- [ ] T052 [P] Select component for dropdowns in src/components/ui/Select.tsx
- [ ] T053 [P] Modal component for dialogs in src/components/ui/Modal.tsx
- [ ] T054 [P] Toast notification component in src/components/ui/Toast.tsx

### UI Components - Feature Specific

- [ ] T055 IssueCard component with priority indicators in src/components/features/issues/IssueCard.tsx
- [ ] T056 CreateIssueForm with validation in src/components/features/issues/CreateIssueForm.tsx
- [ ] T057 IssuesList with filtering and sorting in src/components/features/issues/IssuesList.tsx
- [ ] T058 KanbanBoard with drag-and-drop in src/components/features/issues/KanbanBoard.tsx
- [ ] T059 IssueDetails with workflow actions in src/components/features/issues/IssueDetails.tsx
- [ ] T060 CommentThread with real-time updates in src/components/features/comments/CommentThread.tsx
- [ ] T061 CommentForm with mention support in src/components/features/comments/CommentForm.tsx
- [ ] T062 NotificationDropdown with mark as read in src/components/features/notifications/NotificationDropdown.tsx

### Pages & Routing

- [ ] T063 React Router setup with protected routes in src/App.tsx
- [ ] T064 Login page with Supabase auth in src/pages/LoginPage.tsx
- [ ] T065 Register page with role selection in src/pages/RegisterPage.tsx
- [ ] T066 Dashboard page with issue overview in src/pages/Dashboard.tsx
- [ ] T067 Issues page with list/kanban toggle in src/pages/IssuesPage.tsx
- [ ] T068 Issue detail page with comments in src/pages/IssueDetailPage.tsx

## Phase 3.6: Integration & Real-time Features

- [ ] T069 Setup Supabase real-time subscriptions for issues in src/hooks/useRealtimeIssues.ts
- [ ] T070 Setup real-time subscriptions for comments in src/hooks/useRealtimeComments.ts
- [ ] T071 Setup real-time notifications system in src/hooks/useRealtimeNotifications.ts
- [ ] T072 Implement optimistic updates for workflow transitions in src/hooks/useOptimisticUpdates.ts
- [ ] T073 Error boundary with retry logic in src/components/ErrorBoundary.tsx
- [ ] T074 Global loading states and error handling in src/components/GlobalLoader.tsx

## Phase 3.7: Performance & Accessibility

- [ ] T075 [P] Implement React.memo for expensive components in src/components/features/issues/KanbanBoard.tsx
- [ ] T076 [P] Add virtual scrolling for large issue lists in src/components/features/issues/VirtualizedIssuesList.tsx
- [ ] T077 [P] Implement code splitting for routes in src/pages/
- [ ] T078 [P] Add ARIA labels and keyboard navigation in src/components/ui/
- [ ] T079 [P] Optimize bundle size and analyze with vite-bundle-analyzer
- [ ] T080 [P] Add loading skeletons for better UX in src/components/ui/Skeleton.tsx

## Phase 3.8: Polish & Documentation

- [ ] T081 [P] Unit tests for utility functions in tests/unit/utils/
- [ ] T082 [P] Unit tests for custom hooks in tests/unit/hooks/
- [ ] T083 [P] End-to-end tests with Playwright in tests/e2e/user-workflows.spec.ts
- [ ] T084 [P] Performance tests to validate <2s load time in tests/performance/
- [ ] T085 [P] Update README.md with setup instructions
- [ ] T086 [P] Create deployment guide in docs/deployment.md
- [ ] T087 [P] Add JSDoc comments to all public APIs
- [ ] T088 Manual testing following quickstart.md scenarios

## Dependencies

### Sequential Dependencies

- T001-T007 (Setup) → T008-T011 (Database) → T012-T018 (Types) → T019-T034 (Tests) → T035+ (Implementation)
- T035-T039 (Auth) → T040-T045 (State) → T046-T049 (Services) → T050+ (UI)
- T050-T054 (Base UI) → T055-T062 (Feature UI) → T063-T068 (Pages)
- T069-T074 (Integration) → T075-T080 (Performance) → T081-T088 (Polish)

### Blocking Dependencies

- All tests (T019-T034) MUST fail before implementation starts
- T035 blocks T036-T039, T040-T041
- T050-T054 block T055-T062
- T043-T045 block T069-T071

## Parallel Execution Examples

### Phase 3.1 Setup (All Parallel)

```bash
# Can run simultaneously:
Task: "Configure Tailwind CSS with PostCSS config"
Task: "Configure Vitest testing environment"
Task: "Setup ESLint config with TypeScript strict rules"
Task: "Configure Prettier with project coding standards"
Task: "Setup Husky pre-commit hooks"
```

### Phase 3.4 Contract Tests (All Parallel)

```bash
# Can run simultaneously:
Task: "Contract test GET /api/issues in tests/integration/issues-api.test.ts"
Task: "Contract test POST /api/issues in tests/integration/issues-api.test.ts"
Task: "Contract test GET /api/issues/:id/comments in tests/integration/comments-api.test.ts"
Task: "Contract test Supabase authentication flow in tests/integration/auth-api.test.ts"
```

### Phase 3.5 Services (All Parallel)

```bash
# Can run simultaneously after auth setup:
Task: "Issues service with CRUD operations in src/services/issues.service.ts"
Task: "Comments service with threading in src/services/comments.service.ts"
Task: "Notifications service with real-time subscriptions in src/services/notifications.service.ts"
Task: "Workflow service for status transitions in src/services/workflow.service.ts"
```

## Validation Checklist

_GATE: All items must be checked before marking tasks complete_

- [x] All 4 contract files have corresponding test tasks (T019-T027)
- [x] All 5 entities (User, Issue, WorkflowStep, Comment, Notification) have implementation tasks
- [x] All tests (T019-T034) come before implementation (T035+)
- [x] Parallel tasks ([P]) modify different files
- [x] Each task specifies exact file path
- [x] TDD workflow enforced: failing tests → implementation → passing tests
- [x] Constitutional requirements addressed: quality, testing, UX, performance, type safety

## Notes

- Verify all tests fail before starting implementation phase
- Use conventional commits for each task completion
- Run constitution compliance checks after each phase
- Monitor bundle size and performance metrics throughout development
- Follow accessibility guidelines for all UI components
