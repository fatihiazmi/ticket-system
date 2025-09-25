import { pgTable, uuid, text, boolean, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================
// ENUMS
// =====================================================

export const roleEnum = pgEnum('role', ['developer', 'qa', 'product_manager', 'superadmin']);
export const issueTypeEnum = pgEnum('issue_type', ['bug', 'feature']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);
export const issueStatusEnum = pgEnum('issue_status', [
  'new',
  'in_progress',
  'dev_review',
  'qa_review',
  'pm_review',
  'resolved',
  'rejected',
]);
export const workflowStepTypeEnum = pgEnum('workflow_step_type', [
  'dev_review',
  'qa_review',
  'pm_review',
]);
export const workflowStatusEnum = pgEnum('workflow_status', ['pending', 'approved', 'rejected']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'assignment',
  'status_change',
  'approval_required',
  'comment_added',
  'mention',
]);

// =====================================================
// TABLES
// =====================================================

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  type: issueTypeEnum('type').notNull(),
  priority: priorityEnum('priority').notNull(),
  status: issueStatusEnum('status').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => userProfiles.id, {
      onDelete: 'cascade',
    }),
  assignedTo: uuid('assigned_to').references(() => userProfiles.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  estimatedHours: decimal('estimated_hours', { precision: 8, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 8, scale: 2 }),
});

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id')
    .notNull()
    .references(() => issues.id, {
      onDelete: 'cascade',
    }),
  stepType: workflowStepTypeEnum('step_type').notNull(),
  status: workflowStatusEnum('status').notNull(),
  approverId: uuid('approver_id').references(() => userProfiles.id, {
    onDelete: 'set null',
  }),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id')
    .notNull()
    .references(() => issues.id, {
      onDelete: 'cascade',
    }),
  workflowStepId: uuid('workflow_step_id').references(() => workflowSteps.id, {
    onDelete: 'set null',
  }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => userProfiles.id, {
      onDelete: 'cascade',
    }),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  edited: boolean('edited').notNull().default(false),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, {
      onDelete: 'cascade',
    }),
  relatedIssueId: uuid('related_issue_id')
    .notNull()
    .references(() => issues.id, {
      onDelete: 'cascade',
    }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// =====================================================
// RELATIONS
// =====================================================

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  createdIssues: many(issues, { relationName: 'issueCreator' }),
  assignedIssues: many(issues, { relationName: 'issueAssignee' }),
  workflowSteps: many(workflowSteps),
  comments: many(comments),
  notifications: many(notifications),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  creator: one(userProfiles, {
    fields: [issues.createdBy],
    references: [userProfiles.id],
    relationName: 'issueCreator',
  }),
  assignee: one(userProfiles, {
    fields: [issues.assignedTo],
    references: [userProfiles.id],
    relationName: 'issueAssignee',
  }),
  workflowSteps: many(workflowSteps),
  comments: many(comments),
  notifications: many(notifications),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  issue: one(issues, {
    fields: [workflowSteps.issueId],
    references: [issues.id],
  }),
  approver: one(userProfiles, {
    fields: [workflowSteps.approverId],
    references: [userProfiles.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
  workflowStep: one(workflowSteps, {
    fields: [comments.workflowStepId],
    references: [workflowSteps.id],
  }),
  author: one(userProfiles, {
    fields: [comments.authorId],
    references: [userProfiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(userProfiles, {
    fields: [notifications.userId],
    references: [userProfiles.id],
  }),
  relatedIssue: one(issues, {
    fields: [notifications.relatedIssueId],
    references: [issues.id],
  }),
}));

// =====================================================
// TYPE EXPORTS
// =====================================================

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
