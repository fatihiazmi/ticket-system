import { supabase } from '../lib/supabase.ts';
import type {
  WorkflowStep,
  WorkflowStepWithApprover,
  ApproveWorkflowStepRequest,
  RejectWorkflowStepRequest,
  IssueStatus,
  WorkflowStepType,
  WorkflowStepStatus,
} from '../types/issues.ts';
import { issuesService } from './issues.service.ts';
import { notificationsService } from './notifications.service.ts';

export interface WorkflowServiceResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface WorkflowTransition {
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  requiresApproval: boolean;
  approverRole?: 'developer' | 'qa' | 'product_manager';
  stepType?: WorkflowStepType;
}

class WorkflowService {
  // Define workflow transitions and approval requirements
  private readonly workflowTransitions: WorkflowTransition[] = [
    {
      fromStatus: 'new',
      toStatus: 'in_progress',
      requiresApproval: false,
    },
    {
      fromStatus: 'in_progress',
      toStatus: 'dev_review',
      requiresApproval: true,
      approverRole: 'developer',
      stepType: 'dev_review',
    },
    {
      fromStatus: 'in_progress',
      toStatus: 'new',
      requiresApproval: false,
    },
    {
      fromStatus: 'dev_review',
      toStatus: 'qa_review',
      requiresApproval: false, // Approved by developer in previous step
    },
    {
      fromStatus: 'dev_review',
      toStatus: 'in_progress',
      requiresApproval: false, // Reject back to development
    },
    {
      fromStatus: 'qa_review',
      toStatus: 'pm_review',
      requiresApproval: true,
      approverRole: 'qa',
      stepType: 'qa_review',
    },
    {
      fromStatus: 'qa_review',
      toStatus: 'dev_review',
      requiresApproval: false, // Reject back to dev review
    },
    {
      fromStatus: 'pm_review',
      toStatus: 'resolved',
      requiresApproval: true,
      approverRole: 'product_manager',
      stepType: 'pm_review',
    },
    {
      fromStatus: 'pm_review',
      toStatus: 'qa_review',
      requiresApproval: false, // Reject back to QA
    },
    {
      fromStatus: 'resolved',
      toStatus: 'new',
      requiresApproval: false, // Can reopen if needed
    },
    {
      fromStatus: 'rejected',
      toStatus: 'new',
      requiresApproval: false, // Can reopen rejected issues
    },
  ];

  /**
   * Get available transitions for an issue in a given status
   */
  getAvailableTransitions(currentStatus: IssueStatus): WorkflowTransition[] {
    return this.workflowTransitions.filter(transition => transition.fromStatus === currentStatus);
  }

  /**
   * Check if a status transition is valid
   */
  isValidTransition(fromStatus: IssueStatus, toStatus: IssueStatus): boolean {
    return this.workflowTransitions.some(
      transition => transition.fromStatus === fromStatus && transition.toStatus === toStatus
    );
  }

  /**
   * Get workflow step requirements for a transition
   */
  getTransitionRequirements(
    fromStatus: IssueStatus,
    toStatus: IssueStatus
  ): WorkflowTransition | null {
    return (
      this.workflowTransitions.find(
        transition => transition.fromStatus === fromStatus && transition.toStatus === toStatus
      ) || null
    );
  }

  /**
   * Create a workflow step for approval
   */
  async createWorkflowStep(
    issueId: string,
    stepType: WorkflowStepType,
    approverId?: string
  ): Promise<WorkflowServiceResponse<WorkflowStep>> {
    try {
      const newStep = {
        issue_id: issueId,
        step_type: stepType,
        status: 'pending' as WorkflowStepStatus,
        approver_id: approverId || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .insert(newStep)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create workflow step: ${error.message}`);
      }

      // Create notification for approver if specified
      if (approverId) {
        const { data: issue } = await issuesService.getIssueById(issueId);
        if (issue) {
          await notificationsService.createApprovalRequiredNotification(
            issueId,
            approverId,
            issue.title,
            stepType.replace('_', ' ').toUpperCase()
          );
        }
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get workflow steps for an issue
   */
  async getWorkflowSteps(
    issueId: string
  ): Promise<WorkflowServiceResponse<WorkflowStepWithApprover[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .select(
          `
          *,
          approver:user_profiles!workflow_steps_approver_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch workflow steps: ${error.message}`);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get a specific workflow step
   */
  async getWorkflowStep(
    stepId: string
  ): Promise<WorkflowServiceResponse<WorkflowStepWithApprover>> {
    try {
      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .select(
          `
          *,
          approver:user_profiles!workflow_steps_approver_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .eq('id', stepId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Workflow step not found');
        }
        throw new Error(`Failed to fetch workflow step: ${error.message}`);
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Approve a workflow step
   */
  async approveWorkflowStep(
    request: ApproveWorkflowStepRequest
  ): Promise<WorkflowServiceResponse<WorkflowStep>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Get the workflow step
      const stepResponse = await this.getWorkflowStep(request.stepId);
      if (stepResponse.error || !stepResponse.data) {
        throw new Error('Workflow step not found');
      }

      const step = stepResponse.data;

      // Check if user is authorized to approve this step
      if (step.approverId && step.approverId !== user.id) {
        throw new Error('You are not authorized to approve this workflow step');
      }

      // Check if step is still pending
      if (step.status !== 'pending') {
        throw new Error('Workflow step has already been processed');
      }

      const updateData = {
        status: 'approved' as WorkflowStepStatus,
        approver_id: user.id,
        comments: request.comments || null,
        completed_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .update(updateData)
        .eq('id', request.stepId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to approve workflow step: ${error.message}`);
      }

      // Now transition the issue to the next status
      await this.handleApprovedStep(step);

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Reject a workflow step
   */
  async rejectWorkflowStep(
    request: RejectWorkflowStepRequest
  ): Promise<WorkflowServiceResponse<WorkflowStep>> {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Get the workflow step
      const stepResponse = await this.getWorkflowStep(request.stepId);
      if (stepResponse.error || !stepResponse.data) {
        throw new Error('Workflow step not found');
      }

      const step = stepResponse.data;

      // Check if user is authorized to reject this step
      if (step.approverId && step.approverId !== user.id) {
        throw new Error('You are not authorized to reject this workflow step');
      }

      // Check if step is still pending
      if (step.status !== 'pending') {
        throw new Error('Workflow step has already been processed');
      }

      const updateData = {
        status: 'rejected' as WorkflowStepStatus,
        approver_id: user.id,
        comments: request.comments,
        completed_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .update(updateData)
        .eq('id', request.stepId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reject workflow step: ${error.message}`);
      }

      // Handle the rejection by transitioning back to previous status
      await this.handleRejectedStep(step);

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Transition issue status with workflow validation
   */
  async transitionIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    comment?: string
  ): Promise<WorkflowServiceResponse<any>> {
    try {
      // Get current issue
      const issueResponse = await issuesService.getIssueById(issueId);
      if (issueResponse.error || !issueResponse.data) {
        throw new Error('Issue not found');
      }

      const issue = issueResponse.data;
      const currentStatus = issue.status as IssueStatus;

      // Check if transition is valid
      if (!this.isValidTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
      }

      // Get transition requirements
      const transition = this.getTransitionRequirements(currentStatus, newStatus);
      if (!transition) {
        throw new Error('Transition not found');
      }

      // If approval is required, create workflow step
      if (transition.requiresApproval && transition.stepType) {
        // Find approver based on role requirement
        let approverId: string | undefined;
        if (transition.approverRole) {
          const approver = await this.findApprover(transition.approverRole);
          approverId = approver?.id;
        }

        const stepResponse = await this.createWorkflowStep(
          issueId,
          transition.stepType,
          approverId
        );

        if (stepResponse.error) {
          throw stepResponse.error;
        }

        return {
          data: {
            status: 'pending_approval',
            workflowStep: stepResponse.data,
            message: `Workflow step created for ${transition.stepType} approval`,
          },
          error: null,
        };
      } else {
        // Direct status transition
        const updateResponse = await issuesService.updateIssueStatus(issueId, {
          status: newStatus,
          comment,
        });

        if (updateResponse.error) {
          throw updateResponse.error;
        }

        // Create status change notification
        if (issue.assignedTo) {
          await notificationsService.createStatusChangeNotification(
            issueId,
            issue.assignedTo,
            issue.title,
            newStatus
          );
        }

        return {
          data: updateResponse.data,
          error: null,
        };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Handle approved workflow step by transitioning issue status
   */
  private async handleApprovedStep(step: WorkflowStepWithApprover): Promise<void> {
    const issueResponse = await issuesService.getIssueById(step.issueId);
    if (!issueResponse.data) return;

    const issue = issueResponse.data;

    // Determine next status based on step type
    let nextStatus: IssueStatus;
    switch (step.stepType) {
      case 'dev_review':
        nextStatus = 'qa_review';
        break;
      case 'qa_review':
        nextStatus = 'pm_review';
        break;
      case 'pm_review':
        nextStatus = 'resolved';
        break;
      default:
        return;
    }

    // Update issue status
    await issuesService.updateIssueStatus(issue.id, {
      status: nextStatus,
    });

    // Create status change notification
    if (issue.assignedTo) {
      await notificationsService.createStatusChangeNotification(
        issue.id,
        issue.assignedTo,
        issue.title,
        nextStatus
      );
    }
  }

  /**
   * Handle rejected workflow step by transitioning back to previous status
   */
  private async handleRejectedStep(step: WorkflowStepWithApprover): Promise<void> {
    const issueResponse = await issuesService.getIssueById(step.issueId);
    if (!issueResponse.data) return;

    const issue = issueResponse.data;

    // Determine previous status to revert to
    let previousStatus: IssueStatus;
    switch (step.stepType) {
      case 'dev_review':
        previousStatus = 'in_progress';
        break;
      case 'qa_review':
        previousStatus = 'dev_review';
        break;
      case 'pm_review':
        previousStatus = 'qa_review';
        break;
      default:
        return;
    }

    // Update issue status
    await issuesService.updateIssueStatus(issue.id, {
      status: previousStatus,
    });

    // Create status change notification
    if (issue.assignedTo) {
      await notificationsService.createStatusChangeNotification(
        issue.id,
        issue.assignedTo,
        issue.title,
        previousStatus
      );
    }
  }

  /**
   * Find an approver based on role
   */
  private async findApprover(
    role: 'developer' | 'qa' | 'product_manager'
  ): Promise<{ id: string } | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('id')
        .eq('role', role)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        console.error(`Failed to find approver with role ${role}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error finding approver:`, error);
      return null;
    }
  }

  /**
   * Get pending workflow steps for a user (approvals needed)
   */
  async getPendingApprovalsForUser(
    userId: string
  ): Promise<WorkflowServiceResponse<WorkflowStepWithApprover[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .select(
          `
          *,
          issue:issues!workflow_steps_issue_id_fkey(
            id,
            title,
            status,
            priority
          ),
          approver:user_profiles!workflow_steps_approver_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .eq('approver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch pending approvals: ${error.message}`);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  /**
   * Get workflow history for an issue
   */
  async getWorkflowHistory(
    issueId: string
  ): Promise<WorkflowServiceResponse<WorkflowStepWithApprover[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from('workflow_steps')
        .select(
          `
          *,
          approver:user_profiles!workflow_steps_approver_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `
        )
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch workflow history: ${error.message}`);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;
