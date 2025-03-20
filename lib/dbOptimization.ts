import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cache } from 'react';

// Connection pool to manage Supabase clients
const clientPool: SupabaseClient[] = [];
const MAX_POOL_SIZE = 5;
const IDLE_TIMEOUT = 30000; // 30 seconds

// Create a new Supabase client with optimized settings
export const createOptimizedClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
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
};

// Get a client from the pool or create a new one if pool is not full
export const getClient = (): SupabaseClient => {
  if (clientPool.length > 0) {
    return clientPool.pop()!;
  }
  
  return createOptimizedClient();
};

// Return a client to the pool
export const releaseClient = (client: SupabaseClient) => {
  if (clientPool.length < MAX_POOL_SIZE) {
    clientPool.push(client);
    
    // Set timeout to release the client if it's idle for too long
    setTimeout(() => {
      const index = clientPool.indexOf(client);
      if (index !== -1) {
        clientPool.splice(index, 1);
      }
    }, IDLE_TIMEOUT);
  }
};

// Cached query function to reduce database load
export const cachedQuery = cache(async <T>(
  query: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const client = getClient();
  try {
    const result = await query(client);
    return result;
  } finally {
    releaseClient(client);
  }
});

// Helper function for common queries with caching
export const getFromTable = cache(async <T>(
  tableName: string,
  columns: string = '*',
  filters?: Record<string, any>
): Promise<T[] | null> => {
  const client = getClient();
  try {
    let query = client.from(tableName).select(columns);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return null;
    }
    
    return data as T[];
  } finally {
    releaseClient(client);
  }
});

// Utility to clear all connections in the pool
export const clearConnectionPool = () => {
  clientPool.length = 0;
};
