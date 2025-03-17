import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, UserPlus, Trash, Edit, FileText, Eye, EyeOff } from 'lucide-react';
import useLeadNotifications from '@/hooks/useLeadNotifications';

interface NotificationDetails {
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  lead_count?: number;
  lead_names?: string[];
  lead_ids?: number[];
  deleted_by?: string;
  updated_by?: string;
  updated_by_name?: string;
  actor_name?: string;
  assigned_by?: string;
  previous_assignee?: { name: string; role: string } | null;
  new_assignee?: { name: string; role: string } | null;
  count?: number;
  changes?: Record<string, { old: any; new: any }>;
}

interface Notification {
  id: number;
  created_at: string;
  lead_id: string;
  action_type: string;
  user_id: string;
  workspace_id: string;
  details: NotificationDetails;
  lead_source_id: string | null;
  related_user_id: string | null;
  read: boolean;
}

interface NotificationCenterProps {
  workspaceId: string;
  userId: string;
}

export default function NotificationCenter({ workspaceId, userId }: NotificationCenterProps) {
  const { notifications, markAsRead } = useLeadNotifications();
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'deleted', label: 'Deleted' },
  ];

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'read') return notification.read;
    if (filter === 'unread') return !notification.read;
    return notification.action_type.includes(filter);
  });

  const getNotificationIcon = (type: string) => {
    switch (true) {
      case type.includes('created'):
        return <CheckCircle className="text-green-500" />;
      case type.includes('updated'):
        return <Edit className="text-blue-500" />;
      case type.includes('assigned'):
        return <UserPlus className="text-purple-500" />;
      case type.includes('deleted'):
        return <Trash className="text-red-500" />;
      case type.includes('notes'):
        return <FileText className="text-yellow-500" />;
      default:
        return <AlertCircle className="text-gray-500" />;
    }
  };
  const notificationStyles: Record<string, string> = {
    created: 'bg-green-500/20 border-green-500 shadow-green-500/50',
    data_updated: 'bg-blue-500/20 border-blue-500 shadow-blue-500/50',
    assigned: 'bg-purple-500/20 border-purple-500 shadow-purple-500/50',
    leads_deleted: 'bg-red-500/20 border-red-500 shadow-red-500/50',
    notes: 'bg-yellow-500/20 border-yellow-500 shadow-yellow-500/50',
    default: 'bg-gray-500/20 border-gray-500 shadow-gray-500/50',
  };
  const getPerformerName = (notification: Notification) => {
    const { details } = notification;    
    return details.actor_name || details.updated_by_name || details.assigned_by || details.deleted_by || 'Unknown user';
  };

  const formatNotificationMessage = (notification: Notification) => {
    const { action_type, details } = notification;
    const performerName = getPerformerName(notification);
    switch (action_type) {
      case 'created':
        return `${performerName} created a new lead: ${details.lead_name}`;
      case 'bulk_created':
        return `${performerName} imported ${details.count} new leads`;
      case 'data_updated':
        return `${performerName} updated lead "${details?.changes?.name?.old} to ${details?.changes?.name?.new}`
      case 'assigned':
        return `${performerName} reassigned lead "${details.lead_name}"`;
      case 'leads_deleted':
        return `${performerName} deleted ${details.lead_count} leads`;
      default:
        return `${performerName} performed an action on a lead`;
    }
  };

  const renderNotificationDetails = (notification: Notification) => {
    if (notification.action_type.includes('deleted') && notification.details.lead_names?.length) {
      return (
        <div className="mt-2 text-sm text-gray-300">
          <p className="font-medium mb-1">Deleted leads:</p>
          <ul className="list-disc pl-5">
            {notification.details.lead_names.slice(0, 5).map((name, index) => (
              <li key={index}>{name}</li>
            ))}
            {notification.details.lead_names.length > 5 && <li className="italic">and more...</li>}
          </ul>
        </div>
      );
    }
    return null;
  };

  const handleReadToggle = (id: number, isRead: boolean) => {
    if (isRead) {
      return 
    } else {
      markAsRead(id);
    }
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPage(page + 1);
      setIsLoading(false);
    }, 1000);
  };
  console.log('notifications', notifications);
  return (
    <div className="w-full h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Bell className="mr-2 h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
            </div>
          </div>
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === option.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
              <Bell className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-white">No notifications found</h3>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              
              <div key={notification.id} className={` p-4 rounded-lg border border-gray-700  hover:shadow-md ${notification.read?'bg-gray-500/20 border-gray-500 shadow-gray-500/50':notificationStyles[notification.action_type]}`}>
                <div className="flex cursor-pointer" onClick={() => setExpandedNotification(expandedNotification === notification.id ? null : notification.id)}>
                  <div className="mr-4 mt-1">{getNotificationIcon(notification.action_type)}</div>
                  <div className="flex-1">
                    <p className="text-white">{formatNotificationMessage(notification)}</p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button onClick={() => handleReadToggle(notification.id, notification.read)}>
                    {notification.read ? <EyeOff className="text-gray-500" /> : <Eye className="text-blue-500" />}
                  </button>
                </div>
                {expandedNotification === notification.id && renderNotificationDetails(notification)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
