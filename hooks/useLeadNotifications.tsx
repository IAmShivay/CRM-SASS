import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "./use-toast";
import { useLeadNotificationQuery } from "@/lib/store/services/leadsApi";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";

interface LeadNotification {
  id: string;
  created_at: string;
  lead_id: string;
  action_type: string;
  user_id: string;
  workspace_id: string;
  details: any;
  read: boolean;
}

interface NotificationReadStatus {
  id: string;
  notification_id: string;
  user_id: string;
  read: boolean;
  read_at: string | null;
}

export default function useLeadNotifications() {
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const { data: activeWorkspace } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;
  
  // Get current user ID from Supabase auth
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };    
    getCurrentUser();
  }, []);

  const { data, refetch } = useLeadNotificationQuery({
    workspaceId: workspaceId,
  }, {
    skip: !workspaceId,
    pollingInterval: 90000, 
  });

  // Update notifications and read status when data changes
  useEffect(() => {
    if (data?.data && userId) {
      setNotifications(data.data);
      
      // Fetch read statuses for the current user
      const fetchReadStatuses = async () => {
        const notificationIds = data.data.map((n: LeadNotification) => n.id);
        
        if (notificationIds.length === 0) {
          setUnreadCount(0);
          return;
        }
        
        const { data: readStatuses, error } = await supabase
          .from("notification_read_status")
          .select("*")
          .in("notification_id", notificationIds)
          .eq("user_id", userId);
          
        if (error) {
          console.error("Error fetching notification read statuses:", error);
          return;
        }
        
        // Create a map of notification_id to read status
        const readStatusMap = readStatuses?.reduce((map: Record<string, NotificationReadStatus>, status) => {
          map[status.notification_id] = status;
          return map;
        }, {}) || {};
        
        // Update notifications with read status
        const updatedNotifications = data.data.map((notification: LeadNotification) => {
          const readStatus = readStatusMap[notification.id];
          return {
            ...notification,
            read: readStatus ? readStatus.read : false
          };
        });
        
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter((n: LeadNotification) => !n.read).length);
      };
      
      fetchReadStatuses();
    }
  }, [data, userId]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!workspaceId || !userId) return;

    console.log("Subscribing to Supabase notifications for workspace:", workspaceId);

    const notificationsChannel = supabase
      .channel(`workspace-notifications-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log("Received new notification:", payload);
          refetch()
          // For new notifications
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as LeadNotification;
            
            // Check if this notification is relevant to the current user
            if (newNotification.user_id === userId || newNotification.details?.new_assignee === userId) {
              // Add read property based on user
              const isRead = newNotification.user_id === userId; // Creator has already seen it
              
              setNotifications((prev) => [{...newNotification, read: isRead}, ...prev]);
              
              if (!isRead) {
                setUnreadCount((prev) => prev + 1);
              }
              
              showNotificationToast(newNotification);
            }
          }
          
          // For updated notifications
          else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as LeadNotification;
            
            setNotifications((prev) => 
              prev.map((n) => (n.id === updatedNotification.id ? {...updatedNotification, read: n.read} : n))
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
      });
      
    // Also subscribe to notification_read_status changes
    const readStatusChannel = supabase
      .channel(`read-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_read_status",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Notification read status changed:", payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const readStatus = payload.new as NotificationReadStatus;
            
            setNotifications((prev) => 
              prev.map((n) => (n.id === readStatus.notification_id ? { ...n, read: readStatus.read } : n))
            );
            
            // Update unread count
            setUnreadCount((prev) => {
              const count = notifications.filter(n => !n.read).length;
              return count;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Read status subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from Supabase channels");
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(readStatusChannel);
    };
  }, [workspaceId, userId, notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!userId) return;
      
      // First check if a read status entry exists
      const { data: existingStatus, error: checkError } = await supabase
        .from("notification_read_status")
        .select("*")
        .eq("notification_id", notificationId)
        .eq("user_id", userId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking notification read status:", checkError);
        return;
      }
      
      let updateError;
      
     
      if (existingStatus) {
        const { error } = await supabase
          .from("notification_read_status")
          .update({ 
            read: true,
            read_at: new Date().toISOString() 
          })
          .eq("id", existingStatus.id);
          
        updateError = error;
      } 
      // Otherwise, create a new entry
      else {
        const { error } = await supabase
          .from("notification_read_status")
          .insert({
            notification_id: notificationId,
            user_id: userId,
            read: true,
            read_at: new Date().toISOString()
          });
          
        updateError = error;
      }
      
      if (updateError) {
        console.error("Error marking notification as read:", updateError);
        return;
      }

      // Optimistically update the UI
      setNotifications((prev) => 
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );  
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!workspaceId || !userId) return;
    
    try {
      // Get all unread notification IDs
      const unreadNotificationIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
        
      if (unreadNotificationIds.length === 0) return;
      
      // For each unread notification, check if it exists in the read status table
      const { data: existingStatuses, error: checkError } = await supabase
        .from("notification_read_status")
        .select("notification_id")
        .in("notification_id", unreadNotificationIds)
        .eq("user_id", userId);
        
      if (checkError) {
        console.error("Error checking notification read statuses:", checkError);
        return;
      }
      
      // Extract the IDs that already have entries
      const existingIds = (existingStatuses || []).map(s => s.notification_id);
      
      // For existing entries, update them
      if (existingIds.length > 0) {
        const { error: updateError } = await supabase
          .from("notification_read_status")
          .update({ 
            read: true,
            read_at: new Date().toISOString() 
          })
          .in("notification_id", existingIds)
          .eq("user_id", userId);
          
        if (updateError) {
          console.error("Error updating notification read statuses:", updateError);
        }
      }
      
      // For new entries, create them
      const newIds = unreadNotificationIds.filter(id => !existingIds.includes(id));
      
      if (newIds.length > 0) {
        const newEntries = newIds.map(id => ({
          notification_id: id,
          user_id: userId,
          read: true,
          read_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from("notification_read_status")
          .insert(newEntries);
          
        if (insertError) {
          console.error("Error inserting notification read statuses:", insertError);
        }
      }

      // Optimistically update UI
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const showNotificationToast = (notification: LeadNotification) => {
    let title = "New Notification";
    let message = "";
    
    switch (notification.action_type) {
      case "created":
        title = "New Lead Created";
        message = `Lead created: ${notification.details?.lead_name || "Unnamed lead"}`;
        break;
      case "bulk_created":
        title = "Leads Imported";
        message = `${notification.details?.count || "Multiple"} new leads were imported`;
        break;
      case "updated":
        title = "Lead Updated";
        message = `Lead updated: ${notification.details?.lead_name || ""}`;
        break;
      case "notes_updated":
        title = "Notes Updated";
        message = `Notes updated for a lead`;
        break;
      case "assigned":
        title = "Lead Assigned";
        message = `Lead assigned: ${notification.details?.lead_name || ""}`;
        break;
      case "leads_deleted":
        title = "Leads Deleted";
        message = `${notification.details?.lead_count || "Multiple"} leads were deleted`;
        break;
      case "data_updated":
        title = "Lead Data Updated";
        message = `Data updated for ${notification.details?.lead_name || "a lead"}`;
        break;
      default:
        title = "Lead Activity";
        message = "There was activity on a lead";
    }

    toast({
      title: title,
      description: message,
      duration: 5000,
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetchNotifications: refetch,
  };
}