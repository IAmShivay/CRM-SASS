import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

// Define tag types for the API
export const leadsApi = createApi({
  reducerPath: "/api/leads/",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/leads/leads",
    prepareHeaders: async (headers) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set("authorization", `Bearer ${session.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Lead', 
    'LeadNotification', 
    'LeadByWorkspace', 
    'LeadByUser', 
    'LeadNotes'
  ],
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
