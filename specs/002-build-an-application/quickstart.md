# Quick Start Guide: Issue Tracking Application

**Feature**: Issue Tracking Application  
**Target**: Development Team  
**Setup Time**: ~30 minutes

## Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Modern web browser
- Git for version control

## Environment Setup

### 1. Supabase Configuration
```bash
# 1. Create new Supabase project at https://supabase.com
# 2. Copy project URL and anon key
# 3. Create .env.local file:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
Run the following SQL in Supabase SQL Editor:

```sql
-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('developer', 'qa', 'product_manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issues table  
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'dev_review', 'qa_review', 'pm_review', 'resolved', 'rejected')),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  estimated_hours INTEGER CHECK (estimated_hours > 0),
  actual_hours INTEGER CHECK (actual_hours > 0)
);

-- Create other tables (workflow_steps, comments, notifications)
-- See data-model.md for complete schema
```

### 3. Row Level Security Setup
```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Authenticated users can read issues" ON issues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = created_by);
```

## Installation & Development

### 1. Install Dependencies
```bash
# Clone repository
git checkout 002-build-an-application

# Install existing dependencies
npm install

# Install additional required packages
npm install react-router-dom @dnd-kit/core @dnd-kit/sortable lucide-react tailwindcss

# Install dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom prettier husky lint-staged
```

### 2. Configure Development Tools
```bash
# Initialize Tailwind CSS
npx tailwindcss init -p

# Setup Prettier
echo '{"semi": true, "singleQuote": true, "tabWidth": 2}' > .prettierrc

# Configure Vitest (add to vite.config.ts)
# See technical setup in research.md
```

### 3. Start Development Server
```bash
npm run dev
# App runs on http://localhost:5173
```

## First Time User Setup

### 1. Create Admin User
1. Navigate to signup page
2. Register with your email
3. Choose role: 'product_manager' (has all permissions)
4. Confirm email via Supabase

### 2. Create Test Data
```typescript
// Create sample users via SQL or signup flow
INSERT INTO user_profiles (id, full_name, role) VALUES
  ('user-1-uuid', 'John Developer', 'developer'),
  ('user-2-uuid', 'Jane QA', 'qa'),
  ('user-3-uuid', 'Bob PM', 'product_manager');

// Create sample issues
INSERT INTO issues (title, description, type, priority, created_by) VALUES
  ('Fix login bug', 'Users cannot login with special characters', 'bug', 'high', 'user-1-uuid'),
  ('Add dark mode', 'Implement dark mode toggle', 'feature', 'medium', 'user-3-uuid');
```

## Key User Flows

### Create and Track Issue
1. **Create Issue**: Click "New Issue" → Fill form → Submit
2. **Assign Issue**: Select assignee from dropdown
3. **Start Work**: Assignee changes status to "In Progress"  
4. **Submit for Review**: Change status to "Dev Review"
5. **Approval Flow**: Developer → QA → PM approval chain
6. **Resolution**: Final approval marks issue as "Resolved"

### View Modes
- **List View**: Sortable table with filters
- **Kanban Board**: Drag-and-drop between status columns
- **Toggle**: Switch between views with button in header

### Notifications
- Bell icon shows unread count
- Click to see notification dropdown
- Real-time updates via Supabase subscriptions

## Testing the Application

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Create new issue with all fields
- [ ] Assign issue to team member
- [ ] Transition through workflow states
- [ ] Add comments to issues
- [ ] Switch between list and kanban views
- [ ] Filter and search issues
- [ ] Receive notifications for assignments
- [ ] Test role-based permissions

### Automated Testing
```bash
# Run unit tests
npm run test

# Run component tests
npm run test:components

# Run e2e tests (when configured)
npm run test:e2e
```

## Common Issues & Solutions

### Supabase Connection Issues
- Verify environment variables are set
- Check Supabase project status
- Ensure RLS policies allow data access

### Authentication Problems
- Clear browser localStorage
- Check email confirmation
- Verify user role is set in user_profiles table

### Permission Errors
- Check user role matches required permissions
- Verify RLS policies are correctly configured
- Ensure user profile exists in user_profiles table

## Production Deployment

### Build Application
```bash
npm run build
# Creates dist/ folder with optimized build
```

### Deploy Options
1. **Vercel**: Connect GitHub repo, auto-deploy on push
2. **Netlify**: Drag-and-drop dist/ folder
3. **Custom**: Upload dist/ to any static hosting

### Environment Variables
Set in production hosting:
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## Next Steps
- Set up CI/CD pipeline
- Configure monitoring and error tracking
- Add integration tests
- Implement advanced filtering
- Add email notifications
- Create admin dashboard

## Support
- Check browser console for errors
- Review Supabase logs for database issues
- Use React DevTools for component debugging
- Check network tab for API errors