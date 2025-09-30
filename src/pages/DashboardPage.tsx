import React from 'react';
import { ExitIcon, PersonIcon, GearIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSignOut } from '../hooks/useAuthQuery';
import { Button } from '../components/ui/Button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu.tsx';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const signOutMutation = useSignOut();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      signOutMutation.mutate();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'developer':
        return 'bg-blue-100 text-blue-800';
      case 'qa':
        return 'bg-green-100 text-green-800';
      case 'product_manager':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      {/* Navigation */}
      <nav className='border-b bg-white/80 backdrop-blur-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary'>
                <svg
                  className='h-5 w-5 text-primary-foreground'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
              </div>
              <h1 className='text-xl font-semibold text-foreground'>Issue Tracker</h1>
            </div>

            <div className='flex items-center space-x-4'>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(user?.role || '')}`}
              >
                {user?.role?.replace('_', ' ').toUpperCase()}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' className='relative h-10 w-10 rounded-full'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name} />
                      <AvatarFallback className='bg-primary text-primary-foreground'>
                        {user?.full_name ? getInitials(user.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <div className='flex items-center justify-start gap-2 p-2'>
                    <div className='flex flex-col space-y-1 leading-none'>
                      <p className='font-medium'>{user?.full_name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PersonIcon className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GearIcon className='mr-2 h-4 w-4' />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={signOutMutation.isPending}>
                    {signOutMutation.isPending ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <ExitIcon className='mr-2 h-4 w-4' />
                        Sign out
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-foreground'>Dashboard</h2>
          <p className='mt-2 text-muted-foreground'>
            Welcome back, {user?.full_name?.split(' ')[0]}! Here's what's happening with your
            issues.
          </p>
        </div>

        {/* Stats Grid */}
        <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-0 bg-white/60 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Total Issues</p>
                  <p className='text-2xl font-bold text-foreground'>12</p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                  <svg
                    className='h-6 w-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 bg-white/60 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>In Progress</p>
                  <p className='text-2xl font-bold text-foreground'>5</p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
                  <svg
                    className='h-6 w-6 text-yellow-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 bg-white/60 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Resolved</p>
                  <p className='text-2xl font-bold text-foreground'>7</p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                  <svg
                    className='h-6 w-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 bg-white/60 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Assigned to Me</p>
                  <p className='text-2xl font-bold text-foreground'>3</p>
                </div>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100'>
                  <svg
                    className='h-6 w-6 text-purple-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Issues */}
        <Card className='border-0 bg-white/60 shadow-md backdrop-blur-sm'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-xl'>Recent Issues</CardTitle>
                <CardDescription>Latest issues that need your attention</CardDescription>
              </div>
              <Button
                variant='outline'
                onClick={() => navigate('/issues')}
                className='bg-white/80 hover:bg-white'
              >
                View All Issues
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center space-x-4 rounded-lg bg-white/40 p-4 transition-colors hover:bg-white/60'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
                  <span className='text-sm font-medium text-red-700'>B</span>
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    Login page not responsive on mobile devices
                  </p>
                  <p className='text-sm text-muted-foreground'>Bug • High Priority</p>
                </div>
                <span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'>
                  In Progress
                </span>
              </div>

              <div className='flex items-center space-x-4 rounded-lg bg-white/40 p-4 transition-colors hover:bg-white/60'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                  <span className='text-sm font-medium text-blue-700'>F</span>
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    Add dark mode toggle to settings
                  </p>
                  <p className='text-sm text-muted-foreground'>Feature • Medium Priority</p>
                </div>
                <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                  New
                </span>
              </div>

              <div className='flex items-center space-x-4 rounded-lg bg-white/40 p-4 transition-colors hover:bg-white/60'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                  <span className='text-sm font-medium text-green-700'>F</span>
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    API optimization for better performance
                  </p>
                  <p className='text-sm text-muted-foreground'>Feature • Low Priority</p>
                </div>
                <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                  Resolved
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
