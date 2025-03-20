import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
  realtime: {
    timeout: 30000, // Reduced from 60000 to prevent lingering connections
    params: {
      eventsPerSecond: 5 // Reduced from 10 to lower resource usage
    }
  }
});

// Store active channel subscriptions
const activeChannels: { id: string; unsubscribe: () => void }[] = [];

// Helper function to add a channel subscription
export const addChannelSubscription = (channelId: string, unsubscribe: () => void) => {
  activeChannels.push({ id: channelId, unsubscribe });
};

// Helper function to explicitly close realtime subscriptions when needed
export const closeRealtimeSubscriptions = () => {
  try {
    // Unsubscribe from all active channels
    activeChannels.forEach(channel => {
      channel.unsubscribe();
    });
    
    // Clear the array
    activeChannels.length = 0;
    return true;
  } catch (error) {
    console.error('Error closing realtime subscriptions:', error);
    return false;
  }
};
