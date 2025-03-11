import { leadsApi } from "../base/leadsapi";

export interface Lead {
  [key: string]: any;
}

export const leadsApis = leadsApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], { userId: string; sourceId: string }>({
      query: ({ userId, sourceId }) => ({
        url: `?action=getLeads&userId=${userId}&sourceId=${sourceId}`,
        providesTags: (
          result: Lead[] | undefined,
          error: any,
          workspaceId: number
        ) => [{ type: "Leads", id: workspaceId }],
      }),
    }),
    getLeadsByUser: builder.query<Lead[], { userId: string }>({
      query: ({ userId }) => ({
        url: `?action=getLeadsByUser&userId=${userId}`,
      }),
    }),
    getLeadsByWorkspace: builder.query<Lead[], { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `?action=getLeadsByWorkspace&workspaceId=${workspaceId}`,
      }),
    }),
    getLeadById: builder.query<Lead, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getLeadById&id=${id}`,
      }),
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
    }),
    updateLead: builder.mutation<any, { id: any; leads: any }>({
      query: ({ id, leads }) => ({
        url: `?action=updateLeadById&id=${id}`,
        method: "PUT",
        body: leads, // Pass the body with name and color
      }),
    }),
    assignRole: builder.mutation<any, { id: any; data: any }>({
      query: ({ id, data }) => ({
        url: `?action=assignRoleById&id=${id}`,
        method: "PUT",
        body: data, // Pass the body with name and color
      }),
    }),
    updateLeadData: builder.mutation<any, { id: any; leads: any }>({
      query: ({ id, leads }) => ({
        url: `?action=updateLeadData&id=${id}`,
        method: "PUT",
        body: leads, // Pass the body with name and color
      }),
    }),
    addNotes: builder.mutation<any, { id: any; Note: any }>({
      query: ({ id, Note }) => ({
        url: `?action=updateNotesById&id=${id}`,
        method: "POST",
        body: Note, // Pass the body with name and color
      }),
    }),
    getNotes: builder.query<any, { id: any }>({
      query: ({ id }) => ({
        url: `?action=getNotesById&id=${id}`,
        method: "GET",
      }),
    }),

    deleteLead: builder.mutation<void, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `${id}?userId=${userId}`,
        method: "DELETE",
      }),
    }),
    bulkDeleteLeads: builder.mutation<void, { id: any; workspaceId: any }>({
      query: ({ id, workspaceId }) => ({
        url: `?action=deleteLeads`,
        method: "DELETE",
        body: { id, workspaceId },
      }),
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadsByUserQuery,
  useGetLeadsByWorkspaceQuery,
  useGetLeadByIdQuery,
  useAddNotesMutation,
  useGetNotesQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadDataMutation,
  useAssignRoleMutation,
  useBulkDeleteLeadsMutation,
} = leadsApis;
