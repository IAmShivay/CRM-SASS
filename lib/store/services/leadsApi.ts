import { leadsApi } from "../base/leadsapi";

export interface Lead {
  [key: string]: any;
}

// Create the API with endpoints
const extendedApi = leadsApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], { userId: string; sourceId: string }>({
      query: ({ userId, sourceId }) => ({
        url: `?action=getLeads&userId=${userId}&sourceId=${sourceId}`,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Lead' as const, id })),
              { type: 'Lead' as const, id: 'LIST' },
            ]
          : [{ type: 'Lead' as const, id: 'LIST' }],
    }),
    getLeadsByUser: builder.query<Lead[], { userId: string }>({
      query: ({ userId }) => ({
        url: `?action=getLeadsByUser&userId=${userId}`,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'LeadByUser' as const, id })),
              { type: 'LeadByUser' as const, id: 'LIST' },
            ]
          : [{ type: 'LeadByUser' as const, id: 'LIST' }],
    }),
    getLeadsByWorkspace: builder.query<
      { data: Lead[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } },
      { workspaceId: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string }
    >({
      query: ({ workspaceId, limit = 12, offset = 0, sortBy = 'created_at', sortOrder = 'desc' }) => ({
        url: `?action=getLeadsByWorkspace&workspaceId=${workspaceId}&limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      }),
      providesTags: (result, error, arg) => [
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        ...(result?.data?.map(lead => ({ type: 'Lead' as const, id: lead.id })) || [])
      ],
    }),
    getLeadById: builder.query<Lead, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getLeadById&id=${id}`,
      }),
      providesTags: (result, error, arg) => [{ type: 'Lead' as const, id: arg.id }],
    }),
    createLead: builder.mutation<
      Lead,
      { workspaceId: string; body: Partial<Lead> }
    >({
      query: ({ workspaceId, body }) => ({
        url: `?action=createLead&workspaceId=${workspaceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId },
        { type: 'LeadNotification' as const, id: 'LIST' }
      ],
    }),
    createManyLead: builder.mutation<
      { message: string; data: Lead[] },
      { workspaceId: string; body: Partial<Lead>[] }
    >({
      query: ({ workspaceId, body }) => ({
        url: `?action=createManyLead&workspaceId=${workspaceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId },
        { type: 'LeadNotification' as const, id: 'LIST' }
      ],
    }),
    updateLead: builder.mutation<any, { id: string; leads: any; workspaceId: string }>({
      query: ({ id, leads, workspaceId }) => ({
        url: `?action=updateLeadById&id=${id}&workspaceId=${workspaceId}`,
        method: "PUT",
        body: leads,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Lead' as const, id: arg.id },
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId },
        { type: 'LeadNotification' as const, id: 'LIST' }
      ],
    }),
    assignRole: builder.mutation<any, { id: string; data: any; workspaceId: string }>({
      query: ({ id, data, workspaceId }) => ({
        url: `?action=assignRoleById&id=${id}&workspaceId=${workspaceId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Lead' as const, id: arg.id },
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' }
      ],
    }),
    updateLeadData: builder.mutation<any, { id: string; leads: any; workspaceId: string }>({
      query: ({ id, leads, workspaceId }) => ({
        url: `?action=updateLeadData&id=${id}&workspaceId=${workspaceId}`,
        method: "PUT",
        body: leads,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Lead' as const, id: arg.id },
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' }
      ],
    }),
    addNotes: builder.mutation<any, { id: string; Note: any; workspaceId: string }>({
      query: ({ id, Note }) => ({
        url: `?action=updateNotesById&id=${id}`,
        method: "POST",
        body: Note,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Lead' as const, id: arg.id },
        { type: 'LeadNotes' as const, id: arg.id },
        { type: 'LeadNotes' as const, id: 'LIST' },
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId }
      ],
    }),
    getNotes: builder.query<any, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getNotesById&id=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: 'LeadNotes' as const, id: arg.id },
        { type: 'LeadNotes' as const, id: 'LIST' }
      ],
    }),
    leadNotification: builder.query<void, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `?action=getNotifications&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: 'LeadNotification' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId }
      ],
    }),
    deleteLead: builder.mutation<void, { id: string; userId: string; workspaceId: string }>({
      query: ({ id, userId, workspaceId }) => ({
        url: `${id}?userId=${userId}&workspaceId=${workspaceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Lead' as const, id: arg.id },
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId },
        { type: 'LeadNotification' as const, id: 'LIST' }
      ],
    }),
    bulkDeleteLeads: builder.mutation<void, { id: string[]; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `?action=deleteLeads`,
        method: "DELETE",
        body: { id, workspaceId },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'LeadByWorkspace' as const, id: arg.workspaceId },
        { type: 'LeadByWorkspace' as const, id: 'LIST' },
        { type: 'Lead' as const, id: 'LIST' },
        { type: 'LeadNotification' as const, id: arg.workspaceId },
        { type: 'LeadNotification' as const, id: 'LIST' }
      ],
    }),
  }),
  overrideExisting: false,
});

// Export the hooks
export const {
  useGetLeadsQuery,
  useGetLeadsByUserQuery,
  useGetLeadsByWorkspaceQuery,
  useGetLeadByIdQuery,
  useAddNotesMutation,
  useGetNotesQuery,
  useCreateLeadMutation,
  useCreateManyLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadDataMutation,
  useAssignRoleMutation,
  useBulkDeleteLeadsMutation,
  useLeadNotificationQuery,
} = extendedApi;

// Export the API for direct access to util methods
export { extendedApi as leadsApiExtended };

// Enhanced helper function to invalidate cache when workspace changes
export const invalidateAllCacheOnWorkspaceChange = (workspaceId: string) => {
  return (dispatch: any) => {
    console.log('Invalidating all caches for workspace change to:', workspaceId);
    
    // First reset the entire API state to clear all cached data
    dispatch(extendedApi.util.resetApiState());
    
    // Then invalidate specific tags to ensure proper refetching
    dispatch(extendedApi.util.invalidateTags([
      // Leads related tags
      { type: 'LeadByWorkspace' as const, id: workspaceId },
      { type: 'LeadByWorkspace' as const, id: 'LIST' },
      { type: 'Lead' as const, id: 'LIST' },
      { type: 'LeadNotification' as const, id: workspaceId },
      { type: 'LeadNotification' as const, id: 'LIST' },
      { type: 'LeadByUser' as const, id: 'LIST' },
      { type: 'LeadNotes' as const, id: 'LIST' }
    ]));
    
    // Export the original function for backward compatibility
    return invalidateLeadsCacheOnWorkspaceChange(workspaceId)(dispatch);
  };
};

// Original function for backward compatibility
export const invalidateLeadsCacheOnWorkspaceChange = (workspaceId: string) => {
  return (dispatch: any) => {
    // First reset the entire API state to clear all cached data
    dispatch(extendedApi.util.resetApiState());
    
    // Then invalidate specific tags to ensure proper refetching
    dispatch(extendedApi.util.invalidateTags([
      // Invalidate all workspace-related tags
      { type: 'LeadByWorkspace' as const, id: workspaceId },
      { type: 'LeadByWorkspace' as const, id: 'LIST' },
      // Invalidate all lead-related tags
      { type: 'Lead' as const, id: 'LIST' },
      // Invalidate all notification-related tags
      { type: 'LeadNotification' as const, id: workspaceId },
      { type: 'LeadNotification' as const, id: 'LIST' },
      // Invalidate all user-related tags
      { type: 'LeadByUser' as const, id: 'LIST' },
      // Invalidate all notes-related tags
      { type: 'LeadNotes' as const, id: 'LIST' }
    ]));
  };
};