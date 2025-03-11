import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing Supabase realtime functionality...');
    
    // Create a test lead to trigger the realtime event
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name: 'Test Lead ' + new Date().toISOString(),
          email: `test${Date.now()}@example.com`,
          phone: '+1' + Math.floor(1000000000 + Math.random() * 9000000000),
          contact_method: 'Call',
          created_at: new Date().toISOString(),
          work_id:  1
        }
      ])
      .select();
    
    if (error) {
      console.error('Error inserting test lead:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('Test lead inserted successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Test lead inserted successfully', 
      data 
    });
  } catch (error: any) {
    console.error('Unexpected error in test-realtime:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
