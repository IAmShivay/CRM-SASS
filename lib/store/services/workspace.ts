import { workspaceApi } from "../base/workspace";

interface WorkspaceRequest {
  id?: string; // Optional for create/update, required for delete
  name: string;
  description?: string;
  status: boolean;
}

interface WorkspaceResponse {
  [key: string]: any;
}

export const workspaceApis = workspaceApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new workspace
    createWorkspace: builder.mutation<WorkspaceRequest, WorkspaceResponse>({
      query: (data) => ({
        url: "?action=createWorkspace",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' }
      ],
    }),

    // Update an existing workspace
    updateWorkspace: builder.mutation<WorkspaceRequest, WorkspaceResponse>({
      query: (data) => ({
        url: "?action=updateWorkspaceDetails",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Workspace' as const, id: arg.id ? arg.id : 'LIST' },
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' },
        ...(arg.status !== undefined ? [{ type: 'ActiveWorkspace' as const, id: 'CURRENT' }] : [])
      ],
    }),

    // Delete an existing workspace
    deleteWorkspace: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `?action=deleteWorkspace`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Workspace' as const, id: arg.id },
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' }
      ],
    }),

    // Fetch all workspaces
    getWorkspaces: builder.query<any, void>({
      query: () => ({
        url: "?action=getWorkspaces",
        method: "GET",
      }),
      providesTags: () => [
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' }
      ],
    }),
    // Fetch all workspaces
    getWorkspacesById: builder.query<any, string>({
      query: (id) => ({
        url: `?action=getWorkspacesById&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: 'Workspace' as const, id }
      ],
    }),
    // Fetch workspaces by owner ID
    getWorkspacesByOwnerId: builder.query<any, { ownerId: string }>({
      query: ({ ownerId }) => ({
        url: `?action=getWorkspaces&ownerId=${ownerId}`,
        method: "GET",
      }),
      providesTags: () => [
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' }
      ],
    }),
    getActiveWorkspace: builder.query<any, void>({
      query: () => ({
        url: `?action=getActiveWorkspace`,
        method: "GET",
      }),
      providesTags: () => [
        { type: 'ActiveWorkspace' as const, id: 'CURRENT' }
      ],
    }),
    getRevenueByWorkspace: builder.query<any, string>({
      query: (id) => ({
        url: `?action=getRevenueByWorkspace&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: 'Workspace' as const, id }
      ],
    }),
    getCountByWorkspace: builder.query<any, string>({
      query: (id) => ({
        url: `?action=getCountByWorkspace&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: 'Workspace' as const, id }
      ],
    }),
    getROCByWorkspace: builder.query<any, string>({
      query: (id) => ({
        url: `?action=getROCByWorkspace&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: 'Workspace' as const, id }
      ],
    }),
    getWorkspaceMembers: builder.query<any, string>({
      query: (workspaceId) => ({
        url: `?action=getWorkspaceMembers&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, workspaceId) => [
        { type: 'Workspace' as const, id: workspaceId }
      ],
    }),

    getQualifiedCount: builder.query<any, string>({
      query: (workspaceId) => ({
        url: `?action=getQualifiedLeadsCount&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, workspaceId) => [
        { type: 'Workspace' as const, id: workspaceId }
      ],
    }),
    getWorkspaceDetailsAnalytics: builder.query<any, string>({
      query: (workspaceId) => ({
        url: `?action=getWorkspaceDetailsAnalytics&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, workspaceId) => [
        { type: 'Workspace' as const, id: workspaceId }
      ],
    }),
    // Update the status of a workspace
    updateWorkspaceStatus: builder.mutation<
      { id: string; status: boolean },
      { id: string; status: boolean }
    >({
      query: ({ id, status }) => ({
        url: `?action=updateWorkspaceStatus`,
        method: "PUT",
        body: { id, status },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Workspace' as const, id: arg.id },
        { type: 'Workspace' as const, id: 'LIST' },
        { type: 'WorkspaceList' as const, id: 'LIST' },
        { type: 'ActiveWorkspace' as const, id: 'CURRENT' }
      ],
    }),
  }),
});

// Export hooks for the workspace mutations and queries
export const {
  useGetActiveWorkspaceQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspacesQuery,
  useGetWorkspacesByOwnerIdQuery,
  useUpdateWorkspaceStatusMutation,
  useGetWorkspacesByIdQuery,
  useGetRevenueByWorkspaceQuery,
  useGetCountByWorkspaceQuery,
  useGetROCByWorkspaceQuery,
  useGetWorkspaceMembersQuery,
  useGetQualifiedCountQuery,
  useGetWorkspaceDetailsAnalyticsQuery,
} = workspaceApis;
