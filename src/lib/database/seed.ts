/* eslint-disable */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  userProfiles,
  issues,
  workflowSteps,
  comments,
  notifications,
  type NewUserProfile,
  type NewIssue,
  type NewWorkflowStep,
  type NewComment,
  type NewNotification,
} from './schema.js';

// Database connection for seeding
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Sample data
const sampleUsers: NewUserProfile[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    fullName: 'John Developer',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    role: 'developer',
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    fullName: 'Sarah QA',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    role: 'qa',
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    fullName: 'Mike Manager',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'product_manager',
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    fullName: 'Lisa Lead',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    role: 'developer',
    isActive: true,
  },
];

const sampleIssues: NewIssue[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    title: 'Login page not responsive on mobile devices',
    description:
      'The login form overflows on screens smaller than 768px. Need to add proper responsive styling.',
    type: 'bug',
    priority: 'high',
    status: 'new',
    createdBy: '550e8400-e29b-41d4-a716-446655440003',
    assignedTo: '550e8400-e29b-41d4-a716-446655440001',
    estimatedHours: '4.5',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    title: 'Add dark mode toggle to settings',
    description:
      'Users have requested a dark mode option. Should persist across sessions and respect system preferences.',
    type: 'feature',
    priority: 'medium',
    status: 'in_progress',
    createdBy: '550e8400-e29b-41d4-a716-446655440003',
    assignedTo: '550e8400-e29b-41d4-a716-446655440004',
    estimatedHours: '8.0',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    title: 'Database connection timeout in production',
    description: 'Intermittent 500 errors during peak hours. Connection pool may need tuning.',
    type: 'bug',
    priority: 'high',
    status: 'dev_review',
    createdBy: '550e8400-e29b-41d4-a716-446655440001',
    assignedTo: '550e8400-e29b-41d4-a716-446655440004',
    estimatedHours: '6.0',
    actualHours: '7.5',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    title: 'Export data to CSV functionality',
    description: 'Allow users to export their issue data to CSV format for external reporting.',
    type: 'feature',
    priority: 'low',
    status: 'qa_review',
    createdBy: '550e8400-e29b-41d4-a716-446655440002',
    assignedTo: '550e8400-e29b-41d4-a716-446655440001',
    estimatedHours: '12.0',
    actualHours: '10.5',
  },
];

const sampleWorkflowSteps: NewWorkflowStep[] = [
  {
    issueId: '660e8400-e29b-41d4-a716-446655440003',
    stepType: 'dev_review',
    status: 'approved',
    approverId: '550e8400-e29b-41d4-a716-446655440004',
    comments: 'Code looks good, proper error handling implemented.',
    completedAt: new Date('2025-09-24T10:30:00Z'),
  },
  {
    issueId: '660e8400-e29b-41d4-a716-446655440004',
    stepType: 'dev_review',
    status: 'approved',
    approverId: '550e8400-e29b-41d4-a716-446655440004',
    comments: 'Implementation follows our coding standards.',
    completedAt: new Date('2025-09-23T14:15:00Z'),
  },
  {
    issueId: '660e8400-e29b-41d4-a716-446655440004',
    stepType: 'qa_review',
    status: 'pending',
    approverId: '550e8400-e29b-41d4-a716-446655440002',
  },
];

const sampleComments: NewComment[] = [
  {
    issueId: '660e8400-e29b-41d4-a716-446655440001',
    authorId: '550e8400-e29b-41d4-a716-446655440001',
    content: 'I can reproduce this on iPhone Safari. Working on a fix.',
    isInternal: false,
  },
  {
    issueId: '660e8400-e29b-41d4-a716-446655440002',
    authorId: '550e8400-e29b-41d4-a716-446655440004',
    content: 'Should we also add a light/dark mode preview in the settings?',
    isInternal: false,
  },
  {
    issueId: '660e8400-e29b-41d4-a716-446655440003',
    authorId: '550e8400-e29b-41d4-a716-446655440004',
    content: 'Increased connection pool size and added retry logic.',
    isInternal: true,
  },
];

const sampleNotifications: NewNotification[] = [
  {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440001',
    type: 'assignment',
    title: 'New Issue Assigned',
    message: 'You have been assigned to "Login page not responsive on mobile devices"',
    isRead: false,
  },
  {
    userId: '550e8400-e29b-41d4-a716-446655440002',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440004',
    type: 'approval_required',
    title: 'QA Review Required',
    message: 'Issue "Export data to CSV functionality" needs your QA approval',
    isRead: false,
  },
  {
    userId: '550e8400-e29b-41d4-a716-446655440004',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440002',
    type: 'comment_added',
    title: 'New Comment',
    message: 'Lisa Lead commented on "Add dark mode toggle to settings"',
    isRead: true,
  },
];

async function clearDatabase(): Promise<void> {
  console.log('🗑️ Clearing existing data...');

  // Delete in order to respect foreign key constraints
  await db.delete(notifications);
  await db.delete(comments);
  await db.delete(workflowSteps);
  await db.delete(issues);
  await db.delete(userProfiles);

  console.log('✅ Database cleared');
}

async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data first
    await clearDatabase();

    // Insert users
    console.log('👥 Inserting users...');
    await db.insert(userProfiles).values(sampleUsers);
    console.log(`✅ Inserted ${sampleUsers.length} users`);

    // Insert issues
    console.log('🎯 Inserting issues...');
    await db.insert(issues).values(sampleIssues);
    console.log(`✅ Inserted ${sampleIssues.length} issues`);

    // Insert workflow steps
    console.log('⚡ Inserting workflow steps...');
    await db.insert(workflowSteps).values(sampleWorkflowSteps);
    console.log(`✅ Inserted ${sampleWorkflowSteps.length} workflow steps`);

    // Insert comments
    console.log('💬 Inserting comments...');
    await db.insert(comments).values(sampleComments);
    console.log(`✅ Inserted ${sampleComments.length} comments`);

    // Insert notifications
    console.log('🔔 Inserting notifications...');
    await db.insert(notifications).values(sampleNotifications);
    console.log(`✅ Inserted ${sampleNotifications.length} notifications`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { seedDatabase, clearDatabase };
