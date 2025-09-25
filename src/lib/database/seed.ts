/* eslint-disable */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import {
  issues,
  workflowSteps,
  comments,
  notifications,
  userProfiles,
  type NewIssue,
  type NewWorkflowStep,
  type NewComment,
  type NewNotification,
} from './schema.ts';
import type { Database } from '../../types/database.ts';

// Environment variables
const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Database connections
const sql = postgres(connectionString);
const db = drizzle(sql);
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Demo users data
const demoUsers = [
  {
    email: 'admin@demo.com',
    password: 'password',
    fullName: 'Admin SuperUser',
    role: 'superadmin',
    avatarUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
  },
  {
    email: 'john@demo.com',
    password: 'password',
    fullName: 'John Developer',
    role: 'developer',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
  {
    email: 'sarah@demo.com',
    password: 'password',
    fullName: 'Sarah QA',
    role: 'qa',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
  },
  {
    email: 'mike@demo.com',
    password: 'password',
    fullName: 'Mike Manager',
    role: 'product_manager',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    email: 'lisa@demo.com',
    password: 'password',
    fullName: 'Lisa Lead',
    role: 'developer',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
];

// Create demo users through Supabase Auth
async function createDemoUsers(): Promise<string[]> {
  console.log('👤 Creating demo users through Supabase Auth...');

  // Clean up existing demo users first
  const demoEmails = demoUsers.map(u => u.email);
  const { data: existingUsers } = await supabase.auth.admin.listUsers();

  if (existingUsers) {
    for (const user of existingUsers.users) {
      if (demoEmails.includes(user.email || '')) {
        console.log(`   🗑️ Deleting existing user: ${user.email}`);
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  }

  const createdUserIds: string[] = [];

  // Create new demo users
  for (const user of demoUsers) {
    console.log(`   👤 Creating: ${user.fullName} (${user.email})`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
      },
    });

    if (authError) {
      console.error(`   ❌ Auth creation failed: ${authError.message}`);
      continue;
    }

    if (!authData.user) {
      console.error('   ❌ No user data returned');
      continue;
    }

    createdUserIds.push(authData.user.id);

    // Update the profile with avatar URL and ensure correct role
    // (The trigger creates basic profile, but we need to add avatar and verify role)
    try {
      await db
        .update(userProfiles)
        .set({
          avatarUrl: user.avatarUrl,
          role: user.role as any,
        })
        .where(eq(userProfiles.id, authData.user.id));
      console.log(`   ✅ User created and profile updated with avatar and role`);
    } catch (profileError) {
      console.error(`   ⚠️ Profile update failed: ${profileError}`);
    }
  }

  console.log(`✅ Created ${createdUserIds.length} demo users`);
  return createdUserIds;
}

// Sample data with placeholders for user IDs
const createSampleIssues = (userIds: string[]): NewIssue[] => [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    title: 'Login page not responsive on mobile devices',
    description:
      'The login form overflows on screens smaller than 768px. Need to add proper responsive styling.',
    type: 'bug',
    priority: 'high',
    status: 'new',
    createdBy: userIds[3] || userIds[0], // Mike or fallback to first user
    assignedTo: userIds[1] || userIds[0], // John or fallback to first user
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
    createdBy: userIds[3] || userIds[0], // Mike or fallback
    assignedTo: userIds[4] || userIds[0], // Lisa or fallback
    estimatedHours: '8.0',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    title: 'Database connection timeout in production',
    description: 'Intermittent 500 errors during peak hours. Connection pool may need tuning.',
    type: 'bug',
    priority: 'high',
    status: 'dev_review',
    createdBy: userIds[1] || userIds[0], // John or fallback
    assignedTo: userIds[4] || userIds[0], // Lisa or fallback
    estimatedHours: '6.0',
    actualHours: '7.5',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    title: 'Add user avatar upload functionality',
    description:
      'Allow users to upload custom avatar images. Should support common formats and include image resizing.',
    type: 'feature',
    priority: 'low',
    status: 'pm_review',
    createdBy: userIds[2] || userIds[0], // Sarah or fallback
    assignedTo: userIds[1] || userIds[0], // John or fallback
    estimatedHours: '12.0',
    actualHours: '15.5',
  },
];

const createSampleWorkflowSteps = (userIds: string[]): NewWorkflowStep[] => [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    issueId: '660e8400-e29b-41d4-a716-446655440003',
    stepType: 'dev_review',
    approverId: userIds[1] || userIds[0],
    status: 'approved',
    comments: 'Code looks good. Fixed connection pooling settings.',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    issueId: '660e8400-e29b-41d4-a716-446655440003',
    stepType: 'qa_review',
    approverId: userIds[2] || userIds[0],
    status: 'pending',
    comments: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    issueId: '660e8400-e29b-41d4-a716-446655440004',
    stepType: 'pm_review',
    approverId: userIds[3] || userIds[0],
    status: 'rejected',
    comments: 'Feature needs to be simplified. Too complex for current sprint.',
  },
];

const createSampleComments = (userIds: string[]): NewComment[] => [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    issueId: '660e8400-e29b-41d4-a716-446655440001',
    authorId: userIds[1] || userIds[0],
    content: 'I can reproduce this on iPhone 12. The form fields are cut off.',
    isInternal: false,
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    issueId: '660e8400-e29b-41d4-a716-446655440002',
    authorId: userIds[4] || userIds[0],
    content: 'Working on the implementation. Should have a PR ready by tomorrow.',
    isInternal: true,
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    issueId: '660e8400-e29b-41d4-a716-446655440003',
    authorId: userIds[2] || userIds[0],
    content: 'I noticed this in testing. Happens during load testing with 50+ concurrent users.',
    isInternal: false,
  },
];

const createSampleNotifications = (userIds: string[]): NewNotification[] => [
  {
    id: '990e8400-e29b-41d4-a716-446655440001',
    userId: userIds[1] || userIds[0],
    type: 'assignment',
    title: 'New issue assigned',
    message: 'You have been assigned to issue: Login page not responsive on mobile devices',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440001',
    isRead: false,
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440002',
    userId: userIds[2] || userIds[0],
    type: 'approval_required',
    title: 'QA Review Required',
    message: 'Issue "Database connection timeout in production" needs your review',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440003',
    isRead: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440003',
    userId: userIds[1] || userIds[0],
    type: 'comment_added',
    title: 'New comment on your issue',
    message: 'Sarah QA commented on: Database connection timeout in production',
    relatedIssueId: '660e8400-e29b-41d4-a716-446655440003',
    isRead: true,
  },
];

async function clearDatabase(): Promise<void> {
  console.log('🗑️ Clearing existing data...');
  await db.delete(notifications);
  await db.delete(comments);
  await db.delete(workflowSteps);
  await db.delete(issues);

  // Also clear user_profiles since we'll recreate them with proper auth user IDs
  console.log('🗑️ Clearing user profiles...');
  const { error: clearProfilesError } = await supabase
    .from('user_profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all profiles

  if (clearProfilesError) {
    console.error('⚠️ Error clearing user profiles:', clearProfilesError.message);
  }

  console.log('✅ Database cleared');
}

async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await clearDatabase();

    // Create users through Supabase Auth (triggers will create profiles)
    const userIds = await createDemoUsers();

    if (userIds.length === 0) {
      throw new Error('No users were created');
    }

    // Verify all user profiles exist before proceeding
    console.log('🔍 Verifying user profiles exist...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .in('id', userIds);

    if (profileError) {
      throw new Error(`Failed to verify user profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length !== userIds.length) {
      console.log(`❌ Expected ${userIds.length} profiles, found ${profiles?.length || 0}`);
      throw new Error('Not all user profiles were created by triggers');
    }

    console.log(`✅ Verified ${profiles.length} user profiles exist`);

    // Create sample data with actual user IDs
    const sampleIssues = createSampleIssues(userIds);
    const sampleWorkflowSteps = createSampleWorkflowSteps(userIds);
    const sampleComments = createSampleComments(userIds);
    const sampleNotifications = createSampleNotifications(userIds);

    // Insert sample data
    console.log('🎯 Inserting issues...');
    await db.insert(issues).values(sampleIssues);
    console.log(`✅ Inserted ${sampleIssues.length} issues`);

    console.log('⚡ Inserting workflow steps...');
    await db.insert(workflowSteps).values(sampleWorkflowSteps);
    console.log(`✅ Inserted ${sampleWorkflowSteps.length} workflow steps`);

    console.log('💬 Inserting comments...');
    await db.insert(comments).values(sampleComments);
    console.log(`✅ Inserted ${sampleComments.length} comments`);

    console.log('🔔 Inserting notifications...');
    await db.insert(notifications).values(sampleNotifications);
    console.log(`✅ Inserted ${sampleNotifications.length} notifications`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    demoUsers.forEach(user => {
      console.log(`   ${user.role.padEnd(15)} | ${user.email.padEnd(20)} | password`);
    });
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
if (import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  void main();
}

export { seedDatabase, clearDatabase };
