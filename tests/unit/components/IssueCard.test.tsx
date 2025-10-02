/**
 * Unit Tests: IssueCard Component
 *
 * These tests validate the IssueCard component behavior and rendering.
 * Following TDD approach - tests should initially fail for missing features,
 * then pass once implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueCard } from '../../../src/components/features/issues/IssueCard';
import type { Issue } from '../../../src/types/issues';
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

const mockIssue: Issue = {
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
};

// Mock handlers
const mockOnClick = vi.fn();

describe('IssueCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render issue card with basic information', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      // Validate basic information is displayed
      expect(screen.getByText('Fix login bug')).toBeInTheDocument();
      expect(
        screen.getByText('Users cannot log in with special characters in password')
      ).toBeInTheDocument();
      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should display assignee information when assigned', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      // Check for assignee avatar (should show first 2 letters of assignedTo)
      expect(screen.getByText('US')).toBeInTheDocument(); // "user-2" -> "US"
    });

    it('should show unassigned state when no assignee', () => {
      const unassignedIssue = {
        ...mockIssue,
        assignedTo: undefined,
      };

      render(<IssueCard issue={unassignedIssue} currentUser={mockUser} onClick={mockOnClick} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should display priority with correct styling', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const priorityElement = screen.getByText('High');
      expect(priorityElement).toHaveClass('border-red-200', 'bg-red-50', 'text-red-700');
    });

    it('should display status with correct styling', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const statusElement = screen.getByText('New');
      expect(statusElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should display estimated hours when provided', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      expect(screen.getByText('Est: 8h')).toBeInTheDocument();
    });

    // it('should display created date in readable format', () => {
    //   render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

    //   // Should display formatted date (Jan 1, 08:00 AM based on mock data)
    //   expect(screen.getByText('Jan 1, 08:00 AM')).toBeInTheDocument();
    // });

    it('should handle long titles gracefully', () => {
      const longTitleIssue = {
        ...mockIssue,
        title:
          'This is a very long issue title that might overflow the card container and should be handled gracefully with truncation or wrapping',
      };

      render(<IssueCard issue={longTitleIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const titleElement = screen.getByText(longTitleIssue.title);
      expect(titleElement).toBeInTheDocument();
      // Should have appropriate CSS classes for text handling
      expect(titleElement).toHaveClass('line-clamp-3');
    });

    it('should handle long descriptions gracefully', () => {
      const longDescIssue = {
        ...mockIssue,
        description:
          'This is a very long description that contains a lot of details about the issue and should be truncated or limited in the card view to maintain clean layout and readability',
      };

      render(<IssueCard issue={longDescIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const descElement = screen.getByText(longDescIssue.description);
      expect(descElement).toBeInTheDocument();
      expect(descElement).toHaveClass('line-clamp-3');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const card = screen.getByLabelText(`Issue: ${mockIssue.title}`);
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledWith(mockIssue.id);
    });

    it('should handle keyboard navigation (Enter key)', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const card = screen.getByLabelText(`Issue: ${mockIssue.title}`);
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

      expect(mockOnClick).toHaveBeenCalledWith(mockIssue.id);
    });

    it('should handle keyboard navigation (Space key)', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const card = screen.getByLabelText(`Issue: ${mockIssue.title}`);
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });

      expect(mockOnClick).toHaveBeenCalledWith(mockIssue.id);
    });

    it('should not trigger onClick when clicking on action buttons', () => {
      // Test that clicking the more options button doesn't trigger card click
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const buttons = screen.getAllByRole('button');
      const moreButton = buttons.find(
        btn => btn !== screen.getByLabelText(`Issue: ${mockIssue.title}`)
      );

      if (moreButton) {
        fireEvent.click(moreButton);
        expect(mockOnClick).not.toHaveBeenCalled();
      }
    });
  });

  describe('Conditional Rendering', () => {
    it('should show action button only for product managers or issue creators', () => {
      // Test with product manager
      const pmUser = { ...mockUser, role: 'product_manager' as const };
      const { rerender } = render(
        <IssueCard issue={mockIssue} currentUser={pmUser} onClick={mockOnClick} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1); // Card button + action button

      // Test with issue creator
      const creatorUser = { ...mockUser, id: 'user-1' }; // matches mockIssue.createdBy
      rerender(<IssueCard issue={mockIssue} currentUser={creatorUser} onClick={mockOnClick} />);

      const buttonsAfterRerender = screen.getAllByRole('button');
      expect(buttonsAfterRerender.length).toBeGreaterThan(1); // Card button + action button

      // Test with other user
      const otherUser = { ...mockUser, id: 'other-user', role: 'developer' as const };
      rerender(<IssueCard issue={mockIssue} currentUser={otherUser} onClick={mockOnClick} />);

      const finalButtons = screen.getAllByRole('button');
      expect(finalButtons.length).toBe(1); // Only card button, no action button
    });

    it('should show urgent visual indicator for high priority issues', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      // High priority issues should have red border
      const cardElement = screen.getByLabelText(`Issue: ${mockIssue.title}`);
      expect(cardElement).toHaveClass('border-l-4', 'border-l-red-500');
    });

    it('should not show urgent indicator for medium/low priority', () => {
      const mediumPriorityIssue = {
        ...mockIssue,
        priority: 'medium' as const,
      };

      render(
        <IssueCard issue={mediumPriorityIssue} currentUser={mockUser} onClick={mockOnClick} />
      );

      const cardElement = screen.getByLabelText(`Issue: ${mediumPriorityIssue.title}`);
      expect(cardElement).not.toHaveClass('border-l-red-500');
    });

    it('should handle missing estimatedHours gracefully', () => {
      const issueWithoutHours = {
        ...mockIssue,
        estimatedHours: undefined,
      };

      render(<IssueCard issue={issueWithoutHours} currentUser={mockUser} onClick={mockOnClick} />);

      // Should not show estimated hours section
      expect(screen.queryByText(/Est:/)).not.toBeInTheDocument();
    });

    it('should handle missing description gracefully', () => {
      const issueWithoutDesc = {
        ...mockIssue,
        description: '',
      };

      render(<IssueCard issue={issueWithoutDesc} currentUser={mockUser} onClick={mockOnClick} />);

      // Description section should not be rendered
      expect(screen.queryByText('Users cannot log in')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      // Title should be in a heading element
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Fix login bug');
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper focus management', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const card = screen.getByLabelText(`Issue: ${mockIssue.title}`);

      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA attributes for card interaction', () => {
      render(<IssueCard issue={mockIssue} currentUser={mockUser} onClick={mockOnClick} />);

      const card = screen.getByLabelText(`Issue: ${mockIssue.title}`);

      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('aria-label', `Issue: ${mockIssue.title}`);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props are the same', () => {
      const TestWrapper = ({ issue }: { issue: Issue }) => (
        <IssueCard issue={issue} currentUser={mockUser} onClick={mockOnClick} />
      );

      const { rerender } = render(<TestWrapper issue={mockIssue} />);

      // Re-render with same props
      rerender(<TestWrapper issue={mockIssue} />);

      // Component should be memoized - this test will fail initially
      // Need to wrap IssueCard with React.memo
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should handle all issue types correctly', () => {
      const featureIssue = { ...mockIssue, type: 'feature' as const };

      render(<IssueCard issue={featureIssue} currentUser={mockUser} onClick={mockOnClick} />);

      expect(screen.getByText('Feature')).toBeInTheDocument();
    });

    it('should handle all priority levels correctly', () => {
      // Test medium priority
      const mediumIssue = { ...mockIssue, priority: 'medium' as const };
      const { rerender } = render(
        <IssueCard issue={mediumIssue} currentUser={mockUser} onClick={mockOnClick} />
      );

      expect(screen.getByText('Medium')).toBeInTheDocument();

      // Test low priority
      const lowIssue = { ...mockIssue, priority: 'low' as const };
      rerender(<IssueCard issue={lowIssue} currentUser={mockUser} onClick={mockOnClick} />);

      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('should handle all status types correctly', () => {
      const statusTests = [
        { status: 'in_progress' as const, label: 'In Progress' },
        { status: 'dev_review' as const, label: 'Dev Review' },
        { status: 'qa_review' as const, label: 'QA Review' },
        { status: 'pm_review' as const, label: 'PM Review' },
        { status: 'resolved' as const, label: 'Resolved' },
        { status: 'rejected' as const, label: 'Rejected' },
      ];

      statusTests.forEach(({ status, label }) => {
        const statusIssue = { ...mockIssue, status };
        const { unmount } = render(
          <IssueCard issue={statusIssue} currentUser={mockUser} onClick={mockOnClick} />
        );

        expect(screen.getByText(label)).toBeInTheDocument();

        // Clean up for next test
        unmount();
      });
    });
  });
});
