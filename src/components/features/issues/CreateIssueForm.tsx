import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Label,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  toast,
} from '../../ui';
import { createIssueSchema } from '../../../lib/validations/issues';
import type { CreateIssueRequest, IssueType, IssuePriority } from '../../../types/issues';
import type { UserProfile } from '../../../types/auth';

interface CreateIssueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIssueRequest) => Promise<void>;
  currentUser: UserProfile;
  availableUsers?: UserProfile[];
  isLoading?: boolean;
}

type FormData = {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  assignedTo?: string;
  estimatedHours?: number;
};

export function CreateIssueForm({
  isOpen,
  onClose,
  onSubmit,
  availableUsers = [],
  isLoading = false,
}: CreateIssueFormProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      type: 'bug',
      priority: 'medium',
      description: '',
      title: '',
    },
  });

  const watchedType = watch('type');
  const watchedPriority = watch('priority');

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        assignedTo: data.assignedTo || undefined,
        estimatedHours: data.estimatedHours || undefined,
      });

      toast({
        title: 'Success!',
        description: 'Issue created successfully.',
        variant: 'success',
      });

      onClose();
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create issue',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    onClose();
    reset();
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent size='lg'>
        <ModalHeader>
          <ModalTitle>Create New Issue</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
          {/* Title */}
          <div className='space-y-2'>
            <Label htmlFor='title' className='text-sm font-medium'>
              Title *
            </Label>
            <Input
              id='title'
              placeholder='Enter issue title...'
              {...register('title')}
              error={errors.title?.message}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-sm font-medium'>
              Description *
            </Label>
            <textarea
              id='description'
              rows={4}
              placeholder='Describe the issue in detail...'
              className='flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              {...register('description')}
              disabled={isSubmitting || isLoading}
            />
            {errors.description && (
              <p className='text-xs text-red-500'>{errors.description.message}</p>
            )}
          </div>

          {/* Type and Priority Row */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Type */}
            <div className='space-y-2'>
              <Label htmlFor='type' className='text-sm font-medium'>
                Type *
              </Label>
              <Select
                id='type'
                {...register('type')}
                value={watchedType}
                disabled={isSubmitting || isLoading}
              >
                <option value='bug'>🐛 Bug</option>
                <option value='feature'>✨ Feature</option>
              </Select>
              {errors.type && <p className='text-xs text-red-500'>{errors.type.message}</p>}
            </div>

            {/* Priority */}
            <div className='space-y-2'>
              <Label htmlFor='priority' className='text-sm font-medium'>
                Priority *
              </Label>
              <Select
                id='priority'
                {...register('priority')}
                value={watchedPriority}
                disabled={isSubmitting || isLoading}
              >
                <option value='low'>🟢 Low</option>
                <option value='medium'>🟡 Medium</option>
                <option value='high'>🔴 High</option>
              </Select>
              {errors.priority && <p className='text-xs text-red-500'>{errors.priority.message}</p>}
            </div>
          </div>

          {/* Assignment and Estimation Row */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Assignee */}
            <div className='space-y-2'>
              <Label htmlFor='assignedTo' className='text-sm font-medium'>
                Assign to
              </Label>
              <Select
                id='assignedTo'
                {...register('assignedTo')}
                placeholder='Select assignee (optional)'
                disabled={isSubmitting || isLoading}
              >
                <option value=''>Unassigned</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.role})
                  </option>
                ))}
              </Select>
              {errors.assignedTo && (
                <p className='text-xs text-red-500'>{errors.assignedTo.message}</p>
              )}
            </div>

            {/* Estimated Hours */}
            <div className='space-y-2'>
              <Label htmlFor='estimatedHours' className='text-sm font-medium'>
                Estimated Hours
              </Label>
              <Input
                id='estimatedHours'
                type='number'
                min='0'
                step='0.5'
                placeholder='0'
                {...register('estimatedHours', { valueAsNumber: true })}
                error={errors.estimatedHours?.message}
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <ModalFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || isLoading} className='min-w-[100px]'>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Issue'
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
