import { statusApi } from "../base/status";

// Define types for the API
interface Status {
  id: string; // or number, depending on your backend
  name: string;
  description?: string;
  workspaceId: string; // Include workspaceId if applicable
}

interface NewStatus {
  id?: string;
  name: string;
  color: string;
  countInStatistics: boolean;
  showInWorkspace: boolean;
}

interface UpdatedStatus extends Partial<NewStatus> {
  id: string; // `id` is required for update
}

// Define the RTK Query API
export const statusApis = statusApi.injectEndpoints({
  endpoints: (builder) => ({
    addStatus: builder.mutation<
      Status,
      { statusData: NewStatus; workspaceId: string }
    >({
      query: ({ statusData, workspaceId }) => ({
        url: `?action=createStatus&workspaceId=${workspaceId}`,
        method: "POST",
        body: statusData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Status', id: 'LIST' },
        { type: 'StatusByWorkspace', id: arg.workspaceId },
        { type: 'StatusList', id: arg.workspaceId }
      ],
    }),
    updateStatus: builder.mutation<void, { id: string; updatedStatus: any; workspaceId: string }>({
      query: ({ id, ...updatedStatus }) => ({
        url: `?action=updateStatus&id=${id}`,
        method: "PUT",
        body: updatedStatus,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Status', id: arg.id },
        { type: 'Status', id: 'LIST' },
        { type: 'StatusByWorkspace', id: arg.workspaceId },
        { type: 'StatusList', id: arg.workspaceId }
      ],
    }),
    deleteStatus: builder.mutation<void, { id: string; workspace_id: string }>({
      query: ({ id, workspace_id }) => ({
        url: `?action=deleteStatus&id=${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Status', id: arg.id },
        { type: 'Status', id: 'LIST' },
        { type: 'StatusByWorkspace', id: arg.workspace_id },
        { type: 'StatusList', id: arg.workspace_id }
      ],
    }),
    getStatus: builder.query<Status, string>({
      query: (workspaceId) => ({
        url: `?action=getStatus&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: 'StatusByWorkspace', id: arg },
        { type: 'StatusList', id: arg },
        { type: 'Status', id: 'LIST' }
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useAddStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useGetStatusQuery,
} = statusApis;
