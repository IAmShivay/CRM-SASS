import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

console.log('Initializing server-side Supabase with URL:', supabaseUrl);

// IMPORTANT: Use separate clients for queries and realtime
// This can help avoid conflicts between query connections and realtime connections
const supabaseQuery = createClient(supabaseUrl, supabaseServiceKey);
const supabaseRealtime = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Global variable to store active channels for debugging
let activeChannels: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if Socket.io server is already initialized
  if (!(res.socket as any).server.io) {
    console.log('Initializing Socket.io server...');
    
    // Initialize Socket.io server
    const io = new Server((res.socket as any).server);
    (res.socket as any).server.io = io;
    
    // Handle client connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      socket.emit('connection-established', { message: 'Connected to server' });
      
      // Allow client to trigger a manual test
      socket.on('test-insert', async () => {
        try {
          console.log('Running manual insert test...');
          const { data, error } = await supabaseQuery
            .from('leads')
            .insert([
              { name: 'Test Lead', email: `test${Date.now()}@example.com` }
            ])
            .select();
            
          if (error) {
            console.error('Test insert failed:', error);
            socket.emit('test-result', { success: false, error: error.message });
          } else {
            console.log('Test insert succeeded:', data);
            socket.emit('test-result', { success: true, data });
          }
        } catch (err) {
          console.error('Error during test insert:', err);
          socket.emit('test-result', { success: false, error: String(err) });
        }
      });
      
      // Debug command to check realtime status
      socket.on('check-realtime', () => {
        socket.emit('realtime-status', {
          channels: activeChannels.map(c => ({
            id: c.id,
            state: c.state,
          }))
        });
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    // Try connecting to database first
    supabaseQuery.from('leads').select('count').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error connecting to Supabase:', error);
        } else {
          console.log('Successfully connected to Supabase database');
          // Set up all realtime channels
          setupChannels(io);
        }
      });
  } else {
    console.log('Socket.io server already initialized');
  }
  
  res.status(200).json({ success: true, message: 'Socket.io server is running' });
}

function setupChannels(io: Server) {
  // Clean approach - use completely separate channels for each event type
  
  // 1. INSERT-specific channel
  try {
    const insertChannel = supabaseRealtime
      .channel('insert-only')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('INSERT EVENT RECEIVED!', JSON.stringify(payload, null, 2));
          io.emit('new-lead', payload.new);
        }
      )
      .subscribe((status, err) => {
        console.log('INSERT channel status:', status);
        if (err) {
          console.error('INSERT channel error:', err);
        }
      });
      
    activeChannels.push(insertChannel);
  } catch (error) {
    console.error('Failed to set up INSERT channel:', error);
  }
  
  // 2. UPDATE-specific channel
  try {  
    const updateChannel = supabaseRealtime
      .channel('update-only')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('UPDATE EVENT RECEIVED!', payload);
          io.emit('update-lead', payload.new);
        }
      )
      .subscribe();
      
    activeChannels.push(updateChannel);
  } catch (error) {
    console.error('Failed to set up UPDATE channel:', error);
  }
  
  // 3. DELETE-specific channel  
  try {
    const deleteChannel = supabaseRealtime
      .channel('delete-only')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('DELETE EVENT RECEIVED!', payload);
          io.emit('delete-lead', payload.old);
        }
      )
      .subscribe();
      
    activeChannels.push(deleteChannel);
  } catch (error) {
    console.error('Failed to set up DELETE channel:', error);
  }
  
  // 4. Test broadcast channel
  try {
    const broadcastChannel = supabaseRealtime
      .channel('broadcast')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('Broadcast test received:', payload);
      })
      .subscribe((status) => {
        console.log('Broadcast channel status:', status);
        if (status === 'SUBSCRIBED') {
          // Send a test broadcast message
          setTimeout(() => {
            broadcastChannel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Test broadcast' + Date.now() }
            });
          }, 2000);
        }
      });
      
    activeChannels.push(broadcastChannel);
  } catch (error) {
    console.error('Failed to set up broadcast channel:', error);
  }
}