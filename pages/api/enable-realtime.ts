import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client with admin privileges for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Enabling realtime for leads table...');
    
    // Enable realtime for the leads table using RPC
    const { data, error } = await supabase.rpc('supabase_realtime', {
      table_name: 'leads',
      action: 'enable'
    });
    
    if (error) {
      console.error('Error enabling realtime:', error);
      
      // Try alternative approach with REST API
      console.log('Trying alternative approach...');
      
      // This is a fallback approach that might work depending on your Supabase setup
      const { data: configData, error: configError } = await supabase
        .from('_realtime')
        .insert([{ table: 'leads', publish: true }]);
      
      if (configError) {
        console.error('Alternative approach failed:', configError);
        return res.status(500).json({ 
          success: false, 
          error: error.message,
          alternativeError: configError.message
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Realtime enabled for leads table using alternative approach',
        data: configData
      });
    }
    
    console.log('Realtime enabled successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Realtime enabled for leads table', 
      data 
    });
  } catch (error: any) {
    console.error('Unexpected error in enable-realtime:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
