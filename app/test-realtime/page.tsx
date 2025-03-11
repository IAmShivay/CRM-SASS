"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeSocket, disconnectSocket } from '@/lib/socketService';
import { supabase } from '@/lib/supabaseClient';
import { useGetActiveWorkspaceQuery } from '@/lib/store/services/workspace';

export default function TestRealtimePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { data: activeWorkspace } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Set up socket connection
  useEffect(() => {
    const setupSocket = async () => {
      try {
        addLog('Initializing socket connection...');
        const socket = await initializeSocket();
        
        socket.on('connect', () => {
          addLog(`Socket connected with ID: ${socket.id}`);
          setConnected(true);
        });
        
        socket.on('disconnect', () => {
          addLog('Socket disconnected');
          setConnected(false);
        });
        
        socket.on('new-lead', (data) => {
          addLog(`🎉 NEW LEAD RECEIVED: ${JSON.stringify(data)}`);
        });
        
        socket.on('connection-established', (data) => {
          addLog(`Server connection confirmed: ${JSON.stringify(data)}`);
        });
      } catch (error) {
        addLog(`Socket initialization error: ${error}`);
      }
    };
    
    setupSocket();
    
    return () => {
      disconnectSocket();
    };
  }, []);

  // Set up direct Supabase subscription
  useEffect(() => {
    addLog('Setting up direct Supabase subscription...');
    addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // First, check if we can connect to Supabase
    supabase.from('leads').select('*').limit(1).then(response => {
      if (response.error) {
        addLog(`Error connecting to Supabase: ${response.error.message}`);
      } else {
        addLog(`Successfully connected to Supabase, found ${response.data?.length || 0} leads`);
      }
    });
    
    // Try multiple channel approaches to maximize chances of success
    try {
      // Approach 1: Standard channel with specific event
      const channel = supabase
        .channel('any')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leads',
            filter: ''  // Empty filter to ensure all inserts are captured
          },
          (payload) => {
            addLog(`🎉 INSERT EVENT: ${JSON.stringify(payload.new)}`);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads',
          },
          (payload) => {
            addLog(`📝 UPDATE EVENT: ${JSON.stringify(payload.new)}`);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'leads',
          },
          (payload) => {
            addLog(`🗑️ DELETE EVENT: ${JSON.stringify(payload.old)}`);
          }
        )
        .subscribe((status, error) => {
          addLog(`Supabase direct subscription status: ${status}`);
          if (error) {
            addLog(`Supabase subscription error: ${JSON.stringify(error)}`);
          }
          setSubscribed(status === 'SUBSCRIBED');
        });
      
      // Approach 2: Try with a broadcast channel as fallback
      const broadcastChannel = supabase.channel('broadcast', {
        config: {
          broadcast: { self: true }
        }
      });
      
      broadcastChannel.on('broadcast', { event: 'test' }, (payload) => {
        addLog(`Broadcast received: ${JSON.stringify(payload)}`);
      });
      
      broadcastChannel.subscribe((status) => {
        addLog(`Broadcast channel status: ${status}`);
        // If main channel fails but broadcast works, we know it's a table config issue
        if (status === 'SUBSCRIBED' && !subscribed) {
          addLog('⚠️ Broadcast channel works but table subscription failed - check table config');
        }
      });
      
      // Test broadcast after a short delay
      setTimeout(() => {
        broadcastChannel.send({
          type: 'broadcast',
          event: 'test',
          payload: { message: 'Testing broadcast' }
        });
        addLog('Sent broadcast test message');
      }, 2000);
      
      return () => {
        addLog('Cleaning up Supabase subscriptions');
        channel.unsubscribe();
        broadcastChannel.unsubscribe();
      };
    } catch (error) {
      addLog(`Error setting up Supabase channels: ${error}`);
      return () => {};
    }
  }, []);

  const handleTestInsert = async () => {
    try {
      addLog('Sending test lead insertion request...');
      const response = await fetch(`/api/test-realtime?workspaceId=${workspaceId}`);
      const data = await response.json();
      
      if (data.success) {
        addLog(`Test API response: Lead inserted successfully`);
      } else {
        addLog(`Test API error: ${data.error}`);
      }
    } catch (error) {
      addLog(`Error testing lead insertion: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Realtime Lead Notifications Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Socket.io: {connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${subscribed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Supabase Realtime: {subscribed ? 'Subscribed' : 'Not Subscribed'}</span>
            </div>
            
            <Button onClick={handleTestInsert}>Insert Test Lead</Button>
          </div>
          
          <div className="border rounded-md p-4 h-96 overflow-y-auto bg-gray-50">
            <h3 className="font-semibold mb-2">Event Logs:</h3>
            {logs.map((log, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {log}
              </div>
            ))}
            {logs.length === 0 && <div className="text-gray-400">No events yet...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
