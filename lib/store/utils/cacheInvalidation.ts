import { createAction } from '@reduxjs/toolkit';
import { leadsApiExtended } from '../services/leadsApi';
import { memberApi } from '../services/members';
import { statusApis } from '../services/status';
import { webhookApis } from '../services/webhooks';
import { workspaceApis } from '../services/workspace';

// Create a specific action for workspace change
export const workspaceChanged = createAction<string>('workspace/changed');

/**
 * Comprehensive utility function to invalidate all caches when workspace changes
 * This ensures that all data is properly refetched for the new workspace
 * 
 * @param workspaceId The ID of the new workspace
 */
export const invalidateAllCacheOnWorkspaceChange = (workspaceId: string, dispatch: any) => {
  console.log('Invalidating all caches for workspace change to:', workspaceId);
  
  // First reset all API states to clear all cached data
  dispatch(leadsApiExtended.util.resetApiState());
  dispatch(webhookApis.util.resetApiState());
  dispatch(memberApi.util.resetApiState());
  dispatch(statusApis.util.resetApiState());
  
  // Then invalidate specific tags to ensure proper refetching
  
  // Leads related tags
  dispatch(leadsApiExtended.util.invalidateTags([
    { type: 'LeadByWorkspace' as const, id: workspaceId },
    { type: 'LeadByWorkspace' as const, id: 'LIST' },
    { type: 'Lead' as const, id: 'LIST' },
    { type: 'LeadNotification' as const, id: workspaceId },
    { type: 'LeadNotification' as const, id: 'LIST' },
    { type: 'LeadByUser' as const, id: 'LIST' },
    { type: 'LeadNotes' as const, id: 'LIST' }
  ]));
  
  // Webhooks related tags
  dispatch(webhookApis.util.invalidateTags([
    { type: 'Webhook' as const, id: 'LIST' },
    { type: 'WebhookByWorkspace' as const, id: workspaceId },
    { type: 'WebhookSource' as const, id: 'LIST' }
  ]));
  
  // Members related tags
  dispatch(memberApi.util.invalidateTags([
    { type: 'Member' as const, id: 'LIST' },
    { type: 'MemberByWorkspace' as const, id: workspaceId },
    { type: 'MemberList' as const, id: workspaceId }
  ]));
  
  // Status related tags
  dispatch(statusApis.util.invalidateTags([
    { type: 'Status' as const, id: 'LIST' },
    { type: 'StatusByWorkspace' as const, id: workspaceId },
    { type: 'StatusList' as const, id: workspaceId }
  ]));
  
  // Workspace related tags
  dispatch(workspaceApis.util.invalidateTags([
    { type: 'Workspace' as const, id: workspaceId },
    { type: 'Workspace' as const, id: 'LIST' },
    { type: 'WorkspaceList' as const, id: 'LIST' },
    { type: 'ActiveWorkspace' as const, id: 'CURRENT' }
  ]));
  
  // Dispatch a workspace changed action for any other reducers that need to respond
  dispatch(workspaceChanged(workspaceId));
};
