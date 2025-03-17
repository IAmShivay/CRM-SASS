import { webhookApi } from "../base/webhooks";

interface WebhookRequest {
  status: boolean;
  type: string;
  name: string;
  webhook_url?: string;
  workspaceId?: string;
}

interface WebhookResponse {
  [key: string]: any;
}

export const webhookApis = webhookApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new webhook
    webhook: builder.mutation<WebhookRequest, WebhookResponse & { workspaceId: string }>({
      query: (credentials) => ({
        url: "?action=createWebhook",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Webhook', id: 'LIST' },
        { type: 'WebhookByWorkspace', id: arg.workspaceId }
      ],
    }),

    // Update an existing webhook
    updateWebhook: builder.mutation<WebhookRequest, { data: any; id: string; workspaceId: string }>({
      query: ({ data, id }) => ({
        url: `?action=updateWebhook&id=${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Webhook', id: arg.id },
        { type: 'Webhook', id: 'LIST' },
        { type: 'WebhookByWorkspace', id: arg.workspaceId }
      ],
    }),

    // Delete an existing webhook
    deleteWebhook: builder.mutation<{ id: string }, { id: string; workspaceId: string }>({
      query: ({ id }) => ({
        url: `?action=deleteWebhook`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Webhook', id: arg.id },
        { type: 'Webhook', id: 'LIST' },
        { type: 'WebhookByWorkspace', id: arg.workspaceId }
      ],
    }),

    // Fetch webhooks
    getWebhooks: builder.query<any, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getWebhooks&id=${id}`, // Include the id as a query parameter
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: 'WebhookByWorkspace', id: arg.id },
        { type: 'Webhook', id: 'LIST' }
      ],
    }),
    getWebhooksBySourceId: builder.query<
      any,
      { id: string; workspaceId: string }
    >({
      query: ({ id, workspaceId }) => ({
        url: `?action=getWebhooksBySourceId&sourceId=${id}&workspaceId=${workspaceId}`, // Include the id as a query parameter
        method: "GET",
      }),
      providesTags: (result, error, arg) => [
        { type: 'WebhookByWorkspace', id: arg.id },
        { type: 'Webhook', id: 'LIST' }
      ],
    }),
    changeWebhookStatus: builder.mutation<
      { id: string; status: boolean; workspaceId: string },
      { id: string; status: boolean; workspaceId: string }
    >({
      query: ({ id, status, workspaceId }) => ({
        url: `?action=changeWebhookStatus`,
        method: "PUT",
        body: { id, status },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Webhook', id: arg.id },
        { type: 'Webhook', id: 'LIST' },
        { type: 'WebhookByWorkspace', id: arg.workspaceId }
      ],
    }),
  }),
});

// Export hooks for the mutations and queries
export const {
  useWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useGetWebhooksQuery,
  useChangeWebhookStatusMutation,
  useGetWebhooksBySourceIdQuery,
} = webhookApis;
