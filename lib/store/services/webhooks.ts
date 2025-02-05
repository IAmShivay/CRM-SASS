import { webhookApi } from "../base/webhooks";

interface WebhookRequest {
  status: boolean;
  type: string;
  name: string;
  webhook_url?: string;
}

interface WebhookResponse {
  [key: string]: any;
}

export const webhookApis = webhookApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new webhook
    webhook: builder.mutation<WebhookRequest, WebhookResponse>({
      query: (credentials) => ({
        url: "?action=createWebhook",
        method: "POST",
        body: credentials,
      }),
    }),

    // Update an existing webhook
    updateWebhook: builder.mutation<WebhookRequest, { data: any; id: string }>({
      query: ({ data, id }) => ({
        url: `?action=updateWebhook&id=${id}`,
        method: "PUT",
        body: data,
      }),
    }),

    // Delete an existing webhook
    deleteWebhook: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({
        url: `?action=deleteWebhook`,
        method: "DELETE",
        body: { id },
      }),
    }),

    // Fetch webhooks
    getWebhooks: builder.query<any, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getWebhooks&id=${id}`, // Include the id as a query parameter
        method: "GET",
      }),
    }),
    getWebhooksBySourceId: builder.query<any,{ id: string; workspaceId: string }>({
      query: ({ id, workspaceId }) => ({
        url: `?action=getWebhooksBySourceId&sourceId=${id}&workspaceId=${workspaceId}`, // Include the id as a query parameter
        method: "GET",
      }),
    }),
    changeWebhookStatus: builder.mutation<
      { id: string; status: boolean },
      { id: string; status: boolean }
    >({
      query: ({ id, status }) => ({
        url: `?action=changeWebhookStatus`,
        method: "PUT",
        body: { id, status },
      }),
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
