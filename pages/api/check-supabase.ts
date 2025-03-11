import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Check if credentials exist
    const results: {
      credentials: {
        url: boolean;
        anonKey: boolean;
        serviceKey: boolean;
        urlValue: string | undefined;
      };
      connection: { 
        success: boolean; 
        error: string | null;
      };
      tables: { 
        success: boolean; 
        data: any[] | null;
        error: string | null;
      };
      realtimeConfig: { 
        success: boolean; 
        data: any[] | null;
        error: string | null;
      };
    } = {
      credentials: {
        url: !!supabaseUrl,
        anonKey: !!supabaseKey,
        serviceKey: !!serviceRoleKey,
        urlValue: supabaseUrl
      },
      connection: { success: false, error: null },
      tables: { success: false, data: null, error: null },
      realtimeConfig: { success: false, data: null, error: null }
    };
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl as string, (serviceRoleKey || supabaseKey) as string);
    
    // Test basic connection
    try {
      const { data, error } = await supabase.auth.getSession();
      results.connection.success = !error;
      results.connection.error = error ? error.message : null;
    } catch (err: any) {
      results.connection.error = err.message;
    }
    
    // Check tables
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .limit(1);
      
      results.tables.success = !error;
      results.tables.data = data;
      results.tables.error = error ? error.message : null;
    } catch (err: any) {
      results.tables.error = err.message;
    }
    
    // Check realtime configuration
    try {
      // This is a special query to check realtime configuration
      // It will only work if you have the service role key and proper permissions
      const { data, error } = await supabase
        .rpc('get_realtime_config')
        .select('*');
      
      results.realtimeConfig.success = !error;
      results.realtimeConfig.data = data;
      results.realtimeConfig.error = error ? error.message : null;
    } catch (err: any) {
      results.realtimeConfig.error = err.message;
    }
    
    // Return diagnostic information
    return res.status(200).json({
      success: true,
      diagnostics: results,
      message: 'Supabase diagnostic check completed',
      instructions: `
        If you're having issues with Supabase realtime:
        
        1. Make sure realtime is enabled in your Supabase project settings
        2. Check that your 'leads' table is included in the realtime publication
        3. Verify your RLS (Row Level Security) policies allow access to the table
        4. Ensure your Supabase project has the latest version with realtime support
        
        To enable realtime for your table, run this SQL in the Supabase SQL editor:
        
        -- Enable realtime for the leads table
        begin;
          drop publication if exists supabase_realtime;
          create publication supabase_realtime;
        commit;
        alter publication supabase_realtime add table leads;
      `
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to run Supabase diagnostics'
    });
  }
}
