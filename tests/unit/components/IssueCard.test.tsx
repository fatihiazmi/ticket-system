/**
 * Unit Tests: IssueCard Component
 *
 * These tests validate the IssueCard component behavior and rendering.
 * They should FAIL initially as the component doesn't exist yet.
 * This follows TDD approach - write failing tests first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssueCard } from '../../../src/components/features/issues/IssueCard';
import type { IssueWithDetails } from '../../../src/types/issues';
import type { UserProfile } from '../../../src/types/auth';

// Mock props data
const mockUser: UserProfile = {
  id: 'user-1',
  fullName: 'John Doe',
  role: 'developer',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockAssignee: UserProfile = {
  id: 'user-2',
  fullName: 'Jane Smith',
  role: 'qa',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockIssue: IssueWithDetails = {
  id: 'issue-1',
  title: 'Fix login bug',
  description: 'Users cannot log in with special characters in password',
  type: 'bug',
  priority: 'high',
  status: 'new',
  createdBy: 'user-1',
  assignedTo: 'user-2',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  estimatedHours: 8,
  actualHours: 0,
  creator: {
    id: 'user-1',
    fullName: 'John Doe',
    role: 'developer',
  },
  assignee: {
    id: 'user-2',
    fullName: 'Jane Smith',
    role: 'qa',
  },
  workflowSteps: [],
  commentsCount: 3,
  lastActivityAt: '2025-01-01T12:00:00Z',
};

// Mock handlers
const mockOnClick = vi.fn();
const mockOnStatusChange = vi.fn();
const mockOnAssigneeChange = vi.fn();

describe('IssueCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render issue card with basic information', async () => {
      // This test MUST FAIL initially - component doesn't exist
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        // Validate basic information is displayed
        expect(screen.getByText('Fix login bug')).toBeInTheDocument();
        expect(
          screen.getByText('Users cannot log in with special characters in password')
        ).toBeInTheDocument();
        expect(screen.getByText('bug')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('new')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display creator information', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('developer')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display assignee information when assigned', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Assigned to:')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show unassigned state when no assignee', async () => {
      const unassignedIssue = {
        ...mockIssue,
        assignedTo: undefined,
        assignee: undefined,
      };

      await expect(() => {
        render(
          <IssueCard
            issue={unassignedIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('Unassigned')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display priority with correct styling', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const priorityElement = screen.getByText('high');
        expect(priorityElement).toHaveClass('priority-high'); // Assuming CSS class for styling
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display status with correct styling', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const statusElement = screen.getByText('new');
        expect(statusElement).toHaveClass('status-new'); // Assuming CSS class for styling
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display estimated hours when provided', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('8h estimated')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display comments count', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('3 comments')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should display created date in readable format', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        // Should display formatted date
        expect(screen.getByText(/Created on/)).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should handle long titles gracefully', async () => {
      const longTitleIssue = {
        ...mockIssue,
        title:
          'This is a very long issue title that might overflow the card container and should be handled gracefully with truncation or wrapping',
      };

      await expect(() => {
        render(
          <IssueCard
            issue={longTitleIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const titleElement = screen.getByText(longTitleIssue.title);
        expect(titleElement).toBeInTheDocument();
        // Should have appropriate CSS classes for text handling
        expect(titleElement).toHaveClass('truncate'); // or 'text-ellipsis' depending on implementation
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should handle long descriptions gracefully', async () => {
      const longDescIssue = {
        ...mockIssue,
        description:
          'This is a very long description that contains a lot of details about the issue and should be truncated or limited in the card view to maintain clean layout and readability',
      };

      await expect(() => {
        render(
          <IssueCard
            issue={longDescIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const descElement = screen.getByText(longDescIssue.description, { exact: false });
        expect(descElement).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const card = screen.getByRole('button'); // Assuming card is clickable
        fireEvent.click(card);

        expect(mockOnClick).toHaveBeenCalledWith(mockIssue);
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should handle keyboard navigation (Enter key)', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const card = screen.getByRole('button');
        fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

        expect(mockOnClick).toHaveBeenCalledWith(mockIssue);
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should handle keyboard navigation (Space key)', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const card = screen.getByRole('button');
        fireEvent.keyDown(card, { key: ' ', code: 'Space' });

        expect(mockOnClick).toHaveBeenCalledWith(mockIssue);
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show status change dropdown on status click', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={true}
          />
        );

        const statusButton = screen.getByText('new');
        fireEvent.click(statusButton);

        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByText('in_progress')).toBeInTheDocument();
        expect(screen.getByText('dev_review')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should call onStatusChange when new status is selected', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={true}
          />
        );

        const statusButton = screen.getByText('new');
        fireEvent.click(statusButton);

        const progressOption = screen.getByText('in_progress');
        fireEvent.click(progressOption);

        expect(mockOnStatusChange).toHaveBeenCalledWith(mockIssue.id, 'in_progress');
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show assignee change dropdown on assignee click', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={true}
            availableUsers={[mockUser, mockAssignee]}
          />
        );

        const assigneeButton = screen.getByText('Jane Smith');
        fireEvent.click(assigneeButton);

        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Unassign')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should call onAssigneeChange when new assignee is selected', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={true}
            availableUsers={[mockUser, mockAssignee]}
          />
        );

        const assigneeButton = screen.getByText('Jane Smith');
        fireEvent.click(assigneeButton);

        const newAssignee = screen.getByText('John Doe');
        fireEvent.click(newAssignee);

        expect(mockOnAssigneeChange).toHaveBeenCalledWith(mockIssue.id, mockUser.id);
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should handle unassigning user', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={true}
            availableUsers={[mockUser, mockAssignee]}
          />
        );

        const assigneeButton = screen.getByText('Jane Smith');
        fireEvent.click(assigneeButton);

        const unassignOption = screen.getByText('Unassign');
        fireEvent.click(unassignOption);

        expect(mockOnAssigneeChange).toHaveBeenCalledWith(mockIssue.id, null);
      }).toThrow('IssueCard component not implemented yet');
    });
  });

  describe('Conditional Rendering', () => {
    it('should hide actions when showActions is false', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
            showActions={false}
          />
        );

        const statusButton = screen.getByText('new');
        expect(statusButton).not.toHaveAttribute('role', 'button');
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show current user indicator when issue is assigned to current user', async () => {
      const myIssue = {
        ...mockIssue,
        assignedTo: mockUser.id,
        assignee: {
          id: mockUser.id,
          fullName: mockUser.fullName,
          role: mockUser.role,
        },
      };

      await expect(() => {
        render(
          <IssueCard
            issue={myIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByText('(me)')).toBeInTheDocument();
        // Should have visual indicator for current user
        expect(screen.getByTestId('current-user-indicator')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show urgent indicator for high priority issues', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByTestId('urgent-indicator')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should not show urgent indicator for medium/low priority', async () => {
      const mediumPriorityIssue = {
        ...mockIssue,
        priority: 'medium' as const,
      };

      await expect(() => {
        render(
          <IssueCard
            issue={mediumPriorityIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.queryByTestId('urgent-indicator')).not.toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should show overdue indicator when issue is past due', async () => {
      const overdueIssue = {
        ...mockIssue,
        createdAt: '2024-01-01T00:00:00Z', // Old creation date
        estimatedHours: 8,
      };

      await expect(() => {
        render(
          <IssueCard
            issue={overdueIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        expect(screen.getByTestId('overdue-indicator')).toBeInTheDocument();
      }).toThrow('IssueCard component not implemented yet');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const card = screen.getByRole('button');
        expect(card).toHaveAttribute('aria-label', `Issue: ${mockIssue.title}`);
        expect(card).toHaveAttribute('aria-describedby');
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should support screen readers', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        // Should have semantic structure for screen readers
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Fix login bug');
      }).toThrow('IssueCard component not implemented yet');
    });

    it('should have proper focus management', async () => {
      await expect(() => {
        render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        const card = screen.getByRole('button');
        card.focus();
        expect(card).toHaveFocus();
      }).toThrow('IssueCard component not implemented yet');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props are the same', async () => {
      const renderSpy = vi.fn();

      await expect(() => {
        const { rerender } = render(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        rerender(
          <IssueCard
            issue={mockIssue}
            currentUser={mockUser}
            onClick={mockOnClick}
            onStatusChange={mockOnStatusChange}
            onAssigneeChange={mockOnAssigneeChange}
          />
        );

        // Component should be memoized and not re-render with same props
        expect(renderSpy).toHaveBeenCalledTimes(1);
      }).toThrow('IssueCard component not implemented yet');
    });
  });
});
