"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Phone,
  BarChart,
  Settings,
  Menu,
  X,
  UserCircle,
  LogOut,
  ChevronDown,
  Plus,
  Podcast,
  SquareCode,
  Folder,
  Contact,
  Bell,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useCreateWorkspaceMutation,
  useGetActiveWorkspaceQuery,
  useGetWorkspacesByOwnerIdQuery,
  useGetWorkspacesQuery,
  useUpdateWorkspaceStatusMutation,
} from "@/lib/store/services/workspace";
import { useGetStatusQuery } from "@/lib/store/services/status";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGetLeadsByWorkspaceQuery } from "@/lib/store/services/leadsApi";
import { useParams } from "next/navigation";
import { ThemeToggle } from "../theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { skipToken } from "@reduxjs/toolkit/query";

import { RootState } from "@/lib/store/store";
import { toggleCollapse, setCollapse } from "@/lib/store/slices/sideBar";
import { useDispatch, useSelector } from "react-redux";
import useLeadNotifications from "@/hooks/useLeadNotifications";
import { invalidateLeadsCacheOnWorkspaceChange, leadsApiExtended } from "@/lib/store/services/leadsApi";
import { invalidateAllCacheOnWorkspaceChange } from "@/lib/store/utils/cacheInvalidation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  logoSrc?: string;
  logoAlt?: string;
  isOpen?: boolean;
  setIsOpen: (open: boolean) => void;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
  industry?: string;
  status?: boolean;
  type?: string;
}

export function Sidebar({
  className,
  logoSrc = "/logo.svg",
  logoAlt = "Company Logo",
  isOpen,
  setIsOpen,
}: SidebarProps) {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  const pathname = usePathname();
  const { unreadCount } = useLeadNotifications();
  console.log(unreadCount)
  const unreadBadge = unreadCount ? unreadCount : 'NA'
  console.log(unreadBadge)
  const router = useRouter();
  const [updateWorkspaceStatus] = useUpdateWorkspaceStatusMutation();
  const {
    data: workspacesData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetWorkspacesQuery();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [createWorkspace] = useCreateWorkspaceMutation();
  const [user, setUser] = useState<any>(null);
  // const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(
    workspacesData?.data || []
  );
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    workspaces[0] || []
  );

  const {
    data: activeWorkspace,
    isLoading: activeWorkspaceLoading,
    isError: activeWorkspaceError,
  } = useGetActiveWorkspaceQuery();
  const { data: workspaceData, isLoading: isLoadingLeads }: any = useGetLeadsByWorkspaceQuery(
    activeWorkspace?.data?.id
      ? {
        workspaceId: activeWorkspace.data.id,
        limit: 1,  // We only need the count, not actual leads
        offset: 0
      }
      : skipToken
  );

  // Get total leads count from pagination data
  const totalLeads = workspaceData?.pagination?.total || "NA";

  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useGetStatusQuery(activeWorkspace?.data?.id ? String(activeWorkspace.data.id) : skipToken);


  // **Filter Leads into Contacts**
  const contactStatuses = new Set(
    Array.isArray((statusData as any)?.data)
      ? (statusData as any)?.data
        .filter((status: any) => status.count_statistics) // ✅ Only keep statuses where count_statistics is true
        .map((status: any) => status.name)
      : []
  );

  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    industry: "",
    type: "sales",
    companySize: "",
    companyType: "",
    timezone: "",
    notifications: {
      email: true,
      sms: true,
      inApp: true,
    },
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null
  );

  const totalContacts = workspaceData?.data?.filter((contact: any) =>
    contactStatuses.has(contact?.status?.name)
  );
  const contactsLength = totalContacts?.length || "NA";

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      label: "Leads Sources",
      icon: Users,
      href: "/leads-sources",
    },
    {
      label: "Leads",
      icon: SquareCode,
      href: "/leads",
      badge: totalLeads,
    },
    {
      label: "Contact",
      icon: MessageSquare,
      href: "/contact",
      badge: contactsLength,
    },
    {
      label: "Analytics",
      icon: BarChart,
      href: "/analytics",
    },
    {
      label: 'Notifications',
      icon: Bell,
      href: '/notifications',
      badge: unreadBadge
    }
    // {
    //   label: "Integration",
    //   icon: Settings,
    //   href: "/integration",
    // },
    // {
    //   label: "Documentation",
    //   icon: Settings,
    //   href: "/documentation",
    // },
  ];
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logout completed");

      window.location.href = "/login"; // Redirect with full page reload
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          if (isMounted) toast.error("Error fetching user data:", error.message as any);
          return;
        }
        if (data && isMounted) setUser(data.user);
      } catch (error: any) {
        if (isMounted) toast.error(error.message);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newWorkspace.name) {
      const newWorkspaceItem = {
        id: (workspaces.length + 1).toString(),
        name: newWorkspace.name,
        role: "Admin",
      };
      console.log(newWorkspace.companyType, newWorkspace.companySize);
      try {
        await createWorkspace({
          name: newWorkspace.name,
          status: true,
          companyType: newWorkspace.companyType,
          companySize: newWorkspace.companySize,
          industry: newWorkspace.industry,
          type: newWorkspace.type,
          timezone: newWorkspace.timezone,
          notifications: newWorkspace.notifications,
        }).unwrap();
        setWorkspaces([...workspaces, newWorkspaceItem]);
        setSelectedWorkspace(newWorkspaceItem);

        setNewWorkspace({
          name: "",
          industry: "",
          type: "sales",
          companySize: "",
          companyType: "",
          timezone: "",
          notifications: {
            email: true,
            sms: true,
            inApp: true,
          },
        });
        toast.success("Workspace created successfully");
        setDialogOpen(false);
        window.location.reload();
      } catch (error: any) {
        toast.error(error.data.error);
      }
    }
  };
  useEffect(() => {
    let isMounted = true;

    if (activeWorkspace?.data && isMounted) {
      setSelectedWorkspace(activeWorkspace.data);
    }

    return () => {
      isMounted = false;
    };
  }, [activeWorkspace]);


  const handleEditWorkspace = (workspace: Workspace) => {
    router.push(`/workspace/${workspace.id}`);
  };
  useEffect(() => {
    let isMounted = true;

    if (workspacesData?.data && isMounted) {
      setWorkspaces(workspacesData.data);
    }

    return () => {
      isMounted = false;
    };
  }, [workspacesData?.data]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    try {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return;

      // Show loading state
      toast.loading("Switching workspace...");

      // Update workspace status
      await updateWorkspaceStatus({ id: workspaceId, status: true });
      setSelectedWorkspace(workspace);

      // Use the comprehensive cache invalidation function to invalidate all API caches
      invalidateAllCacheOnWorkspaceChange(workspaceId, dispatch);

      // Refetch workspace data
      await refetch();

      // Use router.push to navigate appropriately
      const currentPath = window.location.pathname;

      // Check if we're on a workspace-specific page
      if (currentPath.includes('workspace')) {
        router.push(`/workspace/${workspaceId}`);
      } else {
        // For other pages, use router.refresh() to refresh the current page data
        // This is more efficient than a full page reload
        router.refresh();
      }

      // Dismiss loading toast and show success message
      toast.dismiss();
      toast.success(`Switched to workspace: ${workspace.name}`);
    } catch (error) {
      console.error("Failed to change workspace:", error);
      toast.dismiss();
      toast.error("Failed to change workspace");
    }
  };
  // console.log(user)
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  console.log(user)
  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 right-4 z-50 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-slate-900 dark:text-white shadow-lg transform transition-all duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-[80px]" : "w-64",
          className
        )}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-6 hidden md:flex h-8 w-8 rounded-full bg-white dark:bg-slate-800 shadow-md"
          onClick={() => dispatch(toggleCollapse())}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Logo Section */}
        <div className={cn(
          "flex items-center bg-inherit",
          isCollapsed ? "justify-center py-4" : "justify-between py-4 px-4"
        )}>
          <a
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className={cn(
              "flex items-center justify-center bg-black text-white rounded-md font-bold text-xs",
              isCollapsed ? "w-10 h-10" : "w-8 h-8"
            )}>
              SC
            </div>
            {!isCollapsed && <span className="font-semibold text-lg">SCRAFT</span>}
          </a>

          {/* Removing the close button from here since we now have a dedicated mobile menu button */}
        </div>

        {/* Workspace Selector */}
        <div className={cn("mb-4", isCollapsed ? "px-0" : "px-4")}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 p-0"
                    onClick={() => {
                      setIsOpen(!isOpen), dispatch(toggleCollapse());
                    }}
                  >
                    <Folder className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{selectedWorkspace?.name || "Select workspace"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full bg-gray-50 dark:bg-slate-800 rounded-md p-2">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium mr-2">
                  {selectedWorkspace?.name?.charAt(0) || "W"}
                </div>
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {selectedWorkspace?.name || "Select a workspace"}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]">
                  {workspaces?.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      className="flex items-center py-2 cursor-pointer"
                      onClick={() => handleWorkspaceChange(workspace.id)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium mr-2">
                          {workspace.name.charAt(0)}
                        </div>
                        <span className="text-sm">{workspace.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkspace(workspace);
                        }}
                      >
                        <Settings className="h-4 w-4 text-slate-500 hover:text-slate-800" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Workspace
                      </div>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Workspace</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddWorkspace} className="space-y-4">
                        <div>
                          <Label htmlFor="workspaceName">Workspace Name</Label>
                          <Input
                            id="workspaceName"
                            value={newWorkspace.name}
                            onChange={(e) =>
                              setNewWorkspace({
                                ...newWorkspace,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter workspace name"
                            required
                          />
                        </div>
                        <div>
                          <Label>Workspace Type</Label>
                          <Select
                            value={newWorkspace.type}
                            onValueChange={(value) =>
                              setNewWorkspace({
                                ...newWorkspace,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select workspace type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Company Size</Label>
                          <Select
                            value={newWorkspace.companySize}
                            onValueChange={(value) =>
                              setNewWorkspace({
                                ...newWorkspace,
                                companySize: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-50">1-50</SelectItem>
                              <SelectItem value="51-200">51-200</SelectItem>
                              <SelectItem value="201-500">201-500</SelectItem>
                              <SelectItem value="500+">500+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="companyType">Company Type</Label>
                          <Select
                            value={newWorkspace.companyType}
                            onValueChange={(value) =>
                              setNewWorkspace({
                                ...newWorkspace,
                                companyType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="startup">Startup</SelectItem>
                              <SelectItem value="enterprise">
                                Enterprise
                              </SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                              <SelectItem value="nonprofit">Nonprofit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={newWorkspace.industry}
                            onValueChange={(value) =>
                              setNewWorkspace({
                                ...newWorkspace,
                                industry: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Technology">
                                Technology
                              </SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Healthcare">
                                Healthcare
                              </SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Create Workspace
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Navigation Routes */}
        <div
          className="space-y-4 py-2 px-3 overflow-y-auto flex-grow"
          style={{
            maxHeight: "calc(100% - 190px)", // You can adjust the value as needed
            height: "100%", // Ensures it stretches within its container
          }}
        >        {/* General Section */}
          <div className="space-y-1">
            {!isCollapsed && <p className="text-xs font-medium text-gray-500 px-2 mb-2">General</p>}
            {routes.slice(0, 1).map((route) => (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={pathname === route.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white relative",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => setIsOpen(false)}
                    asChild
                  >
                    <Link href={route.href}>
                      <route.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      {!isCollapsed && (
                        <>
                          <span className="ml-2">{route.label}</span>
                          {route.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto bg-blue-100 text-blue-800"
                            >
                              {route.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{route.label}</p>
                    {route.badge && (
                      <span className="ml-2">({route.badge})</span>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>

          {/* Tasks Section */}
          <div className="space-y-1">
            {!isCollapsed && <p className="text-xs font-medium text-gray-500 px-2 mb-2">Tasks</p>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white relative",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-600 dark:text-slate-300">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {!isCollapsed && <span className="ml-2">Tasks</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Tasks</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Apps Section */}
          <div className="space-y-1">
            {!isCollapsed && <p className="text-xs font-medium text-gray-500 px-2 mb-2">Apps</p>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white relative",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-600 dark:text-slate-300">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                  {!isCollapsed && <span className="ml-2">Apps</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Apps</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Main Routes Section */}
          <div className="space-y-1">
            {!isCollapsed && <p className="text-xs font-medium text-gray-500 px-2 mb-2">Pages</p>}
            {routes.slice(1).map((route) => (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={pathname === route.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white relative",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => setIsOpen(false)}
                    asChild
                  >
                    <Link href={route.href}>
                      <route.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      {!isCollapsed && (
                        <>
                          <span className="ml-2">{route.label}</span>
                          {route.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto bg-blue-100 text-blue-800"
                            >
                              {route.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{route.label}</p>
                    {route.badge && (
                      <span className="ml-2">({route.badge})</span>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>

          {/* Other Section */}
          <div className="space-y-1 py-2">
            {!isCollapsed && <p className="text-xs font-medium text-gray-500 px-4 mb-2">Other</p>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname === "/profile" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white relative",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setIsOpen(false)}
                  asChild
                >
                  <Link href="/profile">
                    <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    {!isCollapsed && <span className="ml-2">Settings</span>}
                  </Link>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Settings</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* User Profile Section */}
        <div className={cn(
          "border-t flex items-center left-0 w-full bg-white dark:bg-slate-800 dark:border-slate-700",
          isCollapsed ? "p-2" : "p-4",
          "sticky bottom-0 z-10"
        )}>
          {isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full h-10 p-0">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={user?.user_metadata?.avatar || "/placeholder-avatar.jpg"}
                      alt={`${user?.name || "User"}'s profile`}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {/* User Info */}
                <div className="px-4 py-3 text-sm">
                  <p className="font-semibold text-base">
                    {user?.name ||
                      `${user?.firstName || ""} ${user?.lastName || ""
                        }`.trim() ||
                      "User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || "Email not available"}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Account Settings */}
                <Link href="/profile">
                  <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                </Link>

                {/* Theme Toggle */}
                <DropdownMenuItem className="flex items-center  px-1 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <ThemeToggle />
                  <span>Toggle Theme</span>
                </DropdownMenuItem>

                {/* Logout */}
                <DropdownMenuItem
                  className="flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition-colors cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3 overflow-hidden w-full justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={user?.user_metadata?.avatar || "/placeholder-avatar.jpg"}
                    alt={`${user?.name || "User"}'s profile`}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {user?.user_metadata.firstName  || user?.user_metadata.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || "Email not available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 dark:bg-slate-800 dark:text-white dark:border-slate-700 z-[101]"
                  >
                    <Link href="/profile">
                      <DropdownMenuItem className="dark:hover:bg-slate-700 cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400 dark:hover:bg-slate-700 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {/* {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )} */}
    </>
  );
}
