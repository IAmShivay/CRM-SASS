"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  Phone,
  User,
  UserPlus,
  MoreVertical,
  Loader2,
  MessageCircle,
  Send,
  Plus,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { useGetTagsQuery } from "@/lib/store/services/tags";
import {
  useGetLeadsByWorkspaceQuery,
  useUpdateLeadMutation,
} from "@/lib/store/services/leadsApi";
import {
  useGetActiveWorkspaceQuery,
  useGetWorkspaceMembersQuery,
} from "@/lib/store/services/workspace";
import { useGetStatusQuery } from "@/lib/store/services/status";

import { Label } from "@/components/ui/label";
import WebhookStatus from "@/components/ui/WebhookStatus";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { CardTitle } from "@/components/ui/card";
import { ResizableHandle } from "@/components/ui/resizable";
// import { useRouter } from "next/router";
// import { Loader2} from "@/components/ui";

// Mock data for contacts
const mockContacts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Contact ${i + 1}`,
  email: `contact${i + 1}@example.com`,
  phone: `+1 555-${String(i + 1).padStart(4, "0")}`,
  status: ["Active", "Inactive", "Pending"][Math.floor(Math.random() * 3)],
  lastContact: new Date(
    Date.now() - Math.random() * 10000000000
  ).toLocaleDateString(),
}));

interface Tags {
  id?: string;
  name: string;
  color: string;
}

export default function ContactPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [leads, setLeads] = useState<any[]>([]);
  const [editNameId, setEditNameId] = useState(null);
  const [nameInfo, setNameInfo] = useState("");
  const [editEmailId, setEditEmailId] = useState(null);
  const [emailInfo, setEmailInfo] = useState("");
  const [editPhoneId, setEditPhoneId] = useState(null);
  const [phoneInfo, setPhoneInfo] = useState("");
  const [editInfoId, setEditInfoId] = useState(null);
  const [editEmailValidationId, setEditEmailValidationId] = useState(null);
  const [emailValidation, setEmailValidation] = useState(false);

  const [businessInfo, setBusinessInfo] = useState(""); // Single field for input
  const [tags, setTags] = useState<Tags[]>([]);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>(
    {}
  );
  const [openAddress, setopenAddress] = useState<Record<string, string[]>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

  const [updateLead, { isLoading }] = useUpdateLeadMutation();
  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id: any) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });

  // fetching leads
  const { data: activeWorkspace, isLoading: isLoadingWorkspace } =
    useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;
  const { data: workspaceData, isLoading: isLoadingLeads }: any =
    useGetLeadsByWorkspaceQuery(
      workspaceId
        ? ({ workspaceId: workspaceId.toString() } as { workspaceId: string }) // Provide workspaceId if it exists
        : ({} as { workspaceId: string }), // Fallback empty object if workspaceId is undefined
      {
        skip: !workspaceId || isLoadingWorkspace, // Skip fetching if workspaceId is missing or loading
        pollingInterval: 60000, // Poll every 2 seconds (2000 ms)
      }
    );
  const { data: workspaceMembers, isLoading: isLoadingMembers } =
    useGetWorkspaceMembersQuery(workspaceId);
  const { data: tagsData, isLoading: isLoadingTags }: any =
    useGetTagsQuery(workspaceId);

  const POLLING_INTERVAL = 10000;
  const { data: statusData, isLoading: isLoadingStatus }: any =
    useGetStatusQuery(workspaceId);

  // **Filter Leads into Contacts**
  const contactStatuses = new Set(
    Array.isArray(statusData?.data)
      ? statusData.data
          .filter((status: any) => status.count_statistics)
          .map((status: any) => status.name)
      : []
  );

  const handleView = (id: number) => {
    router.push(`/leads/${id}`);
  };

  useEffect(() => {
    const fetchLeads = () => {
      if (!isLoadingLeads && workspaceData?.data) {
        let fetchedLeads = workspaceData?.data.map(
          (lead: any, index: number) => ({
            id: lead.id || index + 1,
            Name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            company: lead.company || "",
            position: lead.position || "",
            contact_method: lead.contact_method,
            owner: lead.owner || "Unknown",
            status: lead.status || { name: "New" },
            revenue: lead.revenue || 0,
            assign_to: lead.assign_to || "Not Assigned",
            createdAt: lead.created_at
              ? new Date(lead.created_at).toISOString()
              : new Date().toISOString(),
            isDuplicate: false,
            is_email_valid: lead.is_email_valid,
            is_phone_valid: lead.is_phone_valid,
            sourceId: lead?.lead_source_id ?? null,
            businessInfo: lead?.businessInfo ?? "",
            tag: lead?.tags ?? {},
            address: lead?.address ?? "",
          })
        );

        const duplicates = new Set();
        fetchedLeads.forEach((lead: any) => {
          const duplicate = fetchedLeads.find(
            (l: any) =>
              l.id !== lead.id &&
              (l.email === lead.email || l.phone === lead.phone)
          );
          if (duplicate) {
            duplicates.add(lead.id);
            duplicates.add(duplicate.id);
          }
        });

        // Mark duplicates
        const updatedLeads = fetchedLeads.map((lead: any) => ({
          ...lead,
          isDuplicate: duplicates.has(lead.id),
        }));

        // Sort by most recent
        const sortedLeads = updatedLeads.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setLeads(sortedLeads);

        const QualifiedContacts = sortedLeads.filter((lead: any) =>
          contactStatuses.has(lead.status.name)
        );

        setContacts(QualifiedContacts);
      }
    };

    // Initial fetch
    fetchLeads();

    // Set up polling
    const pollInterval = setInterval(fetchLeads, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [workspaceData, isLoadingLeads]);

  // useEffect(() => {
  //   console.log("contact", contacts);
  // }, [contacts]);

  useEffect(() => {
    if (editInfoId) {
      const contactToEdit = contacts.find((c) => c.id === editInfoId);
      if (contactToEdit) {
        setAddressData({
          address1: contactToEdit.address1 || "",
          address2: contactToEdit.address2 || "",
          country: contactToEdit.country || "",
          zipCode: contactToEdit.zipCode || "",
        });
      }
    }
  }, [editInfoId, contacts]);

  useEffect(() => {
    if (tagsData?.data) {
      setTags(tagsData.data);
    }
  }, [tagsData]);

  // Filter contacts based on search and status
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) => {
        const searchLower = search.toLowerCase();
        const statusLower = statusFilter.toLowerCase();

        const matchesSearch =
          contact?.name?.toLowerCase().includes(searchLower) || // Fix: contact.Name -> contact.name
          contact?.email?.toLowerCase().includes(searchLower) ||
          contact?.phone?.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          contact?.status?.name?.toLowerCase() === statusLower;

        return matchesSearch && matchesStatus;
      })
    : [];

  // contact
  const initiateDirectContact = (lead: any, method: string) => {
    const sanitizedPhone = lead.phone.replace(/\D/g, "");

    switch (method) {
      case "WhatsApp":
        window.open(`https://wa.me/${sanitizedPhone}`, "_blank");
        break;
      case "Call":
        window.location.href = `tel:${lead.phone}`;
        break;
      case "SMS":
        window.location.href = `sms:${lead.phone}`;
        break;
      default:
    }
  };

  //update

  // const tags = [
  //   { name: "Facebook", color: "#1877F2" }, // Blue
  //   { name: "SEO", color: "#22C55E" }, // Green
  //   { name: "Google Ads", color: "#FACC15" }, // Yellow
  //   { name: "LinkedIn", color: "#0A66C2" }, // Dark Blue
  // ];

  const handleUpdate = async (
    id: string | number,
    updatedData: Partial<{
      businessInfo: string;
      tags: string[];
      address: string;
      email: string;
      name: string;
      phone: string;
      is_email_valid: boolean;
    }>
  ) => {
    // console.log("dataa", updatedData);

    if (
      !updatedData.businessInfo === undefined &&
      (!updatedData.tags || updatedData.tags.length === 0) &&
      !updatedData.address?.trim() &&
      !updatedData.email?.trim() &&
      !updatedData.phone?.trim() &&
      updatedData.is_email_valid === undefined &&
      !updatedData.name?.trim()
    ) {
      return; // Prevent empty updates
    }

    try {
      await updateLead({
        id,
        leads: updatedData,
      }).unwrap();
    } catch (error) {
      toast.error("Update failed");
    }

    toast.success("Update successfully");
  };

  const handleTagChange = (id: string, value: string) => {
    setSelectedTags((prev) => {
      const currentTags = prev?.[id] ?? [];

      const updatedTags = currentTags.includes(value)
        ? currentTags.filter((tag) => tag !== value) // Remove tag if already selected
        : [...currentTags, value];

      handleUpdate?.(id, { tags: updatedTags });

      return { ...prev, [id]: updatedTags };
    });
  };
  useEffect(() => {}, [selectedTags]);

  // useEffect(() => {
  //   if (contacts.length > 0) {
  //     const initialTags = contacts.reduce((acc, contact) => {
  //       acc[contact.id] = JSON.parse(contact.tag || "[]"); // Ensure it's an array
  //       return acc;
  //     }, {} as Record<string, string[]>);

  //     setSelectedTags(initialTags);
  //   }
  // }, [contacts]); // Make sure to update when `contacts` change

  const handleRemoveTag = async (contactId: string, tagToRemove: string) => {
    setSelectedTags((prev) => {
      if (!prev || !prev[contactId]) return prev;

      const updatedTags = prev[contactId].filter((tag) => tag !== tagToRemove);

      handleUpdate(contactId, { tags: updatedTags.length ? updatedTags : [] });

      return {
        ...prev,
        [contactId]: updatedTags.length ? updatedTags : [],
      };
    });
  };

  // Daynamic Table/////////////
  const tableHeaders = [
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
    "Address",
  ];
  const [selectedHeaders, setSelectedHeaders] = useState<any[]>([
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
  ]);
  const [addressData, setAddressData] = useState({
    address1: "",
    address2: "",
    country: "",
    zipCode: "",
  });
  const defaultHeaders = [
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [newColumn, setNewColumn] = useState("");

  const addColumn = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedColumn = event.target.value;
    if (selectedColumn && !selectedHeaders.includes(selectedColumn)) {
      const updatedHeaders = [...selectedHeaders];

      // Find the correct index in the original tableHeaders
      const insertIndex = tableHeaders.indexOf(selectedColumn);

      // Find the correct position in selectedHeaders based on tableHeaders order
      for (let i = 0; i < selectedHeaders.length; i++) {
        if (tableHeaders.indexOf(selectedHeaders[i]) > insertIndex) {
          updatedHeaders.splice(i, 0, selectedColumn);
          setSelectedHeaders(updatedHeaders);
          return;
        }
      }

      // If it's the last item, push normally
      updatedHeaders.push(selectedColumn);
      setSelectedHeaders(updatedHeaders);
    }
  };

  // const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownOpenRemove, setDropdownOpenRemove] = useState<string | null>(
    null
  );

  // Toggle dropdown for headers
  const toggleDropdown = (header: string) => {
    setDropdownOpenRemove((prev) => (prev === header ? null : header));
  };

  // };
  const removeColumn = (header: string) => {
    setSelectedHeaders((prevHeaders) =>
      prevHeaders.filter((h) => h !== header)
    );
    setDropdownOpenRemove(null); // Close dropdown after removing
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Rezieable columns
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    Object.fromEntries(tableHeaders.map((header) => [header, 150])) // Default width for each column
  );

  // Correctly type 'size' as ResizeCallbackData
  type ResizeCallbackData = {
    size: { width: number; height: number };
  };

  const handleResize =
    (header: string) =>
    (event: React.SyntheticEvent, { size }: ResizeCallbackData) => {
      setColumnWidths((prevWidths) => ({
        ...prevWidths,
        [header]: size.width, // Update width dynamically
      }));
    };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = contacts.length + 1;
    setContacts([
      ...contacts,
      {
        ...newContact,
        id: newId,
        lastContact: new Date().toLocaleDateString(),
      },
    ]);
    setNewContact({
      name: "",
      email: "",
      phone: "",
      status: "Active",
    });
  };

  if (isLoadingWorkspace || isLoadingLeads || isLoadingMembers)
    return (
      <div className="flex items-center justify-center min-h-screen overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div
      className={`p-6 transition-all duration-500 ease-in-out w-full 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden `}
    >
      <div className="w-full rounded-lg">
        <div className="flex items-center justify-between p-3 md:p-4 border-b mb-4">
          <div className="flex items-center gap-2">
            <div className="md:hidden text-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              Contact Management
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          {/* Search Input */}
          <div className="md:flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>

          {/* Status Filter Dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-[180px] bg-background border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {/* Default "All Status" option */}
              <SelectItem value="all">All Status</SelectItem>

              {/* Convert Set to Array and map over it */}
              {Array.from(contactStatuses).map((statusName) => (
                <SelectItem
                  key={statusName as string}
                  value={statusName as string}
                >
                  {statusName as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contacts Table */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="hidden md:table-header-group bg-muted/50">
                <TableRow>
                  {selectedHeaders?.map((header) => (
                    <TableHead
                      key={header}
                      className="relative text-center font-medium text-muted-foreground"
                      style={{ width: columnWidths[header] }}
                    >
                      <Resizable
                        width={columnWidths[header]}
                        height={30}
                        axis="x"
                        resizeHandles={["e"]}
                        onResize={handleResize(header)}
                      >
                        <div
                          className="flex justify-center items-center cursor-pointer"
                          style={{ width: "100%" }}
                        >
                          <span onClick={() => toggleDropdown(header)}>
                            {header}
                          </span>
                          <span className="w-2 h-full cursor-ew-resize opacity-30"></span>
                        </div>
                      </Resizable>

                      {/* Dropdown menu for removing column */}
                      {dropdownOpenRemove === header && (
                        <div className="absolute right-0 mt-2 bg-popover border shadow-md rounded-md p-2 w-40 z-50">
                          <button
                            className="w-full text-left px-2 py-1 hover:bg-destructive hover:text-destructive-foreground rounded-md text-sm transition-colors"
                            onClick={() => removeColumn(header)}
                          >
                            Hide Column
                          </button>
                        </div>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="p-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 bg-popover border shadow-md rounded-md p-2 w-40 z-50">
                        <select
                          className="w-full border p-2 rounded text-sm bg-background"
                          onChange={(e) => {
                            addColumn(e);
                            setDropdownOpen(false);
                          }}
                        >
                          <option value="">Select Column</option>
                          {tableHeaders
                            .filter(
                              (header) => !selectedHeaders.includes(header)
                            )
                            .map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* Mobile veiw */}
                {filteredContacts.map((contact) => (
                  <React.Fragment key={contact.id}>
                    <TableRow
                      className="md:hidden flex items-center p-4 justify-between gap-4 border-b hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-2 flex-1">
                        {selectedHeaders?.includes("Name") && (
                          <div className="font-medium text-foreground">
                            {editNameId === contact.id ? (
                              <input
                                type="text"
                                placeholder="Enter Name..."
                                className="px-3 py-2 border rounded-md w-full bg-background text-foreground"
                                value={nameInfo}
                                onChange={(e) => setNameInfo(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(contact.id, {
                                      name: nameInfo,
                                    });
                                    setEditNameId(null);
                                  } else if (e.key === "Escape") {
                                    setEditNameId(null);
                                    setNameInfo(contact.Name || "");
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span
                                className="text-foreground"
                                onDoubleClick={() => {
                                  setEditNameId(contact.id);
                                  setNameInfo(contact.Name || "");
                                }}
                              >
                                {contact.Name || (
                                  <span className="text-muted-foreground italic">
                                    Double-click to add name
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        {selectedHeaders.includes("Email") && (
                          <div className="text-sm text-muted-foreground">
                            {editEmailId === contact.id ? (
                              <input
                                type="email"
                                placeholder="Enter Email..."
                                className="px-3 py-2 border rounded-md w-full bg-background text-foreground"
                                value={emailInfo}
                                onChange={(e) => setEmailInfo(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(contact.id, {
                                      email: emailInfo,
                                    });
                                    setEditEmailId(null);
                                  } else if (e.key === "Escape") {
                                    setEditEmailId(null);
                                    setEmailInfo(contact.email || "");
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:underline text-foreground"
                                onDoubleClick={() => {
                                  setEditEmailId(contact.id);
                                  setEmailInfo(contact?.email || "");
                                }}
                              >
                                {contact.email || (
                                  <span className="text-muted-foreground italic">
                                    Double-click to add email
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(contact.id)}
                        className="h-8 w-8 rounded-full"
                      >
                        {expandedRow === contact.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableRow>
                    {expandedRow === contact.id && (
                      <TableRow className="md:hidden">
                        <div className="p-4 space-y-4 bg-muted/20 w-full">
                          {selectedHeaders.includes("Phone") && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-muted-foreground font-medium">Phone</span>
                              <div>
                                {editPhoneId === contact.id ? (
                                  <input
                                    type="text"
                                    placeholder="Enter Phone..."
                                    className="px-3 py-2 border rounded-md w-full bg-background text-foreground"
                                    value={phoneInfo}
                                    onChange={(e) => setPhoneInfo(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdate(contact.id, {
                                          phone: phoneInfo,
                                        });
                                        setEditPhoneId(null);
                                      } else if (e.key === "Escape") {
                                        setEditPhoneId(null);
                                        setPhoneInfo(contact.phone || "");
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <div className="inline-block group relative">
                                    <span
                                      className="cursor-pointer hover:underline text-foreground"
                                      onDoubleClick={() => {
                                        setEditPhoneId(contact.id);
                                        setPhoneInfo(contact.phone || "");
                                      }}
                                    >
                                      {contact.phone || (
                                        <span className="text-muted-foreground italic">
                                          Double-click to add phone
                                        </span>
                                      )}
                                    </span>

                                    {contact.phone && (
                                      <div
                                        className="absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover shadow-md rounded-md p-2 w-[140px] border border-border z-50"
                                        style={{
                                          bottom: "calc(100% + 2px)",
                                          transform: "translateX(-50%)",
                                          pointerEvents: "auto",
                                        }}
                                      >
                                        <button
                                          onClick={() =>
                                            window.open(
                                              `https://wa.me/${contact.phone}`,
                                              "_blank"
                                            )
                                          }
                                          className="flex items-center gap-2 text-sm text-foreground hover:text-green-600"
                                        >
                                          <Send className="h-4 w-4 text-green-500" />
                                          WhatsApp
                                        </button>

                                        <button
                                          onClick={() =>
                                            (window.location.href = `tel:${contact.phone}`)
                                          }
                                          className="flex items-center gap-2 text-sm text-foreground hover:text-blue-600 mt-1"
                                        >
                                          <Phone className="h-4 w-4 text-blue-500" />
                                          Call
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedHeaders.includes("Email Validation") && (
                            <div className="grid grid-cols-2 gap-2">
                              <span className="text-muted-foreground font-medium">
                                Email Validation
                              </span>
                              <div>
                                {editEmailValidationId === contact.id ? (
                                  <select
                                    className="px-3 py-2 border rounded-md bg-background text-foreground"
                                    value={emailValidation ? "true" : "false"}
                                    onChange={async (e) => {
                                      const newValue = e.target.value === "true";
                                      setEmailValidation(newValue);
                                      await handleUpdate(contact.id, {
                                        is_email_valid: newValue,
                                      });
                                      setEditEmailValidationId(null);
                                    }}
                                    autoFocus
                                  >
                                    <option
                                      value="true"
                                    >
                                      True
                                    </option>
                                    <option
                                      value="false"
                                    >
                                      False
                                    </option>
                                  </select>
                                ) : (
                                  <div>
                                    <span
                                      onDoubleClick={() => {
                                        setEditEmailValidationId(contact.id);
                                        setEmailValidation(contact.is_email_valid);
                                      }}
                                      className={`px-2 py-1 text-sm font-medium rounded ${
                                        contact.is_email_valid
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                      }`}
                                    >
                                      {contact.is_email_valid ? "True" : "False"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {/* Desktop Veiw */}
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="hidden md:table-row">
                    {selectedHeaders?.includes("Name") && (
                      <TableCell className="block md:table-cell left-0 bg-white dark:bg-gray-900 z-10 font-medium text-center cursor-pointer">
                        {editNameId === contact.id ? (
                          // Editing mode: Show input field
                          <input
                            type="text"
                            placeholder="Enter Name..."
                            className="px-2 py-1 border rounded-md w-full bg-background text-foreground"
                            value={nameInfo}
                            onChange={(e) => setNameInfo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(contact.id, { name: nameInfo });
                                setEditNameId(null); // Exit edit mode after updating
                              } else if (e.key === "Escape") {
                                setEditNameId(null);
                                setNameInfo(contact.Name || ""); // Reset on cancel
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          // Normal display mode
                          <span
                            className="text-gray-700 dark:text-gray-300"
                            onDoubleClick={() => {
                              setEditNameId(contact.id);
                              setNameInfo(contact.Name || ""); // Pre-fill existing name
                            }}
                          >
                            {contact.Name || (
                              <span className="text-gray-400 italic">
                                Double-click to add name
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}

                    {selectedHeaders.includes("Email") && (
                      <TableCell className="relative text-center cursor-pointer">
                        {editEmailId === contact.id ? (
                          <input
                            type="email"
                            placeholder="Enter Email..."
                            className="px-2 py-1 border rounded-md w-full bg-background text-foreground"
                            value={emailInfo}
                            onChange={(e) => setEmailInfo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(contact.id, { email: emailInfo });
                                setEditEmailId(null);
                              } else if (e.key === "Escape") {
                                setEditEmailId(null);
                                setEmailInfo(contact.email || ""); // Reset on cancel
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="relative inline-block group">
                            {/* Email Text */}
                            <span
                              className="cursor-pointer group-hover:underline text-foreground"
                              onDoubleClick={() => {
                                setEditEmailId(contact.id);
                                setEmailInfo(contact?.email || ""); // Pre-fill existing email
                              }}
                            >
                              {contact.email || (
                                <span className="text-gray-400 italic">
                                  Double-click to add email
                                </span>
                              )}
                            </span>

                            {/* Hover Menu - Ensures it appears properly */}
                            {contact.email && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover shadow-md rounded-md p-2 w-[140px] border border-border z-50"
                                style={{
                                  bottom: "calc(100% )", // Ensures no gap
                                  transform: "translateX(-50%)",
                                  pointerEvents: "auto", // Ensures interaction
                                }}
                              >
                                {/* Send Email */}
                                <button
                                  onClick={() =>
                                    (window.location.href = `mailto:${contact.email}`)
                                  }
                                  className="flex items-center gap-2 text-sm text-foreground hover:text-blue-600 w-full text-left"
                                >
                                  <Send className="h-4 w-4 text-blue-500" />
                                  Send Email
                                </button>

                                {/* Open in Gmail */}
                                <button
                                  onClick={() =>
                                    window.open(
                                      `https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`,
                                      "_blank"
                                    )
                                  }
                                  className="flex items-center gap-2 text-sm text-foreground hover:text-red-600 w-full text-left mt-1"
                                >
                                  <Mail className="h-4 w-4 text-red-500" />
                                  Open in Gmail
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    {selectedHeaders.includes("Phone") && (
                      <TableCell className=" relative text-center cursor-pointer">
                        {editPhoneId === contact.id ? (
                          // Editing mode: Show input field
                          <input
                            type="text"
                            placeholder="Enter Phone..."
                            className="px-2 py-1 border rounded-md w-full bg-background text-foreground"
                            value={phoneInfo}
                            onChange={(e) => setPhoneInfo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(contact.id, { phone: phoneInfo });
                                setEditPhoneId(null); // Exit edit mode after updating
                              } else if (e.key === "Escape") {
                                setEditPhoneId(null);
                                setPhoneInfo(contact.phone || ""); // Reset on cancel
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="inline-block group relative">
                            {/* Phone Number */}
                            <span
                              className="cursor-pointer group-hover:underline text-foreground"
                              onDoubleClick={() => {
                                setEditPhoneId(contact.id);
                                setPhoneInfo(contact.phone || ""); // Pre-fill existing phone number
                              }}
                            >
                              {contact.phone || (
                                <span className="text-gray-400 italic">
                                  Double-click to add phone
                                </span>
                              )}
                            </span>

                            {/* Hover Menu - Appears Below */}
                            <div
                              className="absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-popover shadow-md rounded-md p-2 w-[140px] border border-border z-50"
                              style={{
                                bottom: "calc(100% + 2px)", // Ensures no gap
                                transform: "translateX(-50%)",
                                pointerEvents: "auto", // Ensures interaction
                              }}
                            >
                              {/* WhatsApp */}
                              <button
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${contact.phone}`,
                                    "_blank"
                                  )
                                }
                                className="flex items-center gap-2 text-sm text-foreground hover:text-green-600"
                              >
                                <Send className="h-4 w-4 text-green-500" />
                                WhatsApp
                              </button>

                              {/* Call */}
                              <button
                                onClick={() =>
                                  (window.location.href = `tel:${contact.phone}`)
                                }
                                className="flex items-center gap-2 text-sm text-foreground hover:text-blue-600 mt-1"
                              >
                                <Phone className="h-4 w-4 text-blue-500" />
                                Call
                              </button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    )}

                    {selectedHeaders.includes("Email Validation") && (
                      <TableCell className=" text-center cursor-pointer">
                        {editEmailValidationId === contact.id ? (
                          // Editing mode: Show <select> dropdown
                          <select
                            className="px-2 py-1 border rounded-md bg-background text-foreground"
                            value={emailValidation ? "true" : "false"}
                            onChange={async (e) => {
                              const newValue = e.target.value === "true"; // Convert to boolean
                              setEmailValidation(newValue);
                              await handleUpdate(contact.id, {
                                is_email_valid: newValue,
                              });
                              setEditEmailValidationId(null); // Exit edit mode after update
                            }}
                            autoFocus
                          >
                            <option
                              className="px-2 py-1 text-sm font-semibold rounded bg-green-200 text-green-800"
                              value="true"
                            >
                              True
                            </option>
                            <option
                              className="px-2 py-1 text-sm font-semibold rounded-l-md bg-red-200 text-red-800"
                              value="false"
                            >
                              False
                            </option>
                          </select>
                        ) : (
                          // Normal mode: Show colored text
                          <span
                            onDoubleClick={() => {
                              setEditEmailValidationId(contact.id);
                              setEmailValidation(contact.is_email_valid);
                            }}
                            className={`px-2 py-1 text-sm font-semibold rounded ${
                              contact.is_email_valid
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {contact.is_email_valid ? "True" : "False"}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {selectedHeaders.includes("Platform") && (
                      <TableCell className=" w-[170px] text-center">
                        {contact.sourceId ? (
                          <WebhookStatus
                            sourceId={contact.sourceId}
                            workspaceId={workspaceId}
                          />
                        ) : (
                          <span className="text-gray-500">No Source</span>
                        )}
                      </TableCell>
                    )}

                    {selectedHeaders.includes("Bussiness Info") && (
                      <TableCell
                        className=" text-center cursor-pointer"
                        onDoubleClick={() => {
                          setEditInfoId(contact.id);
                          setBusinessInfo(contact.businessInfo || ""); // Pre-fill existing info
                        }}
                      >
                        {editInfoId === contact.id ? (
                          // Editing mode: Show input field
                          <input
                            type="text"
                            placeholder="Enter Business Info..."
                            className="px-2 py-1 border rounded-md w-full bg-background text-foreground"
                            value={businessInfo}
                            onChange={(e) => setBusinessInfo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(contact.id, { businessInfo });
                                setEditInfoId(null);
                              } else if (e.key === "Escape") {
                                setEditInfoId(null);
                                setBusinessInfo(contact?.bussinessInfo || ""); // Clear input on cancel
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          // Normal display mode
                          <span className="text-gray-700 dark:text-gray-300">
                            {contact.businessInfo || (
                              <span className="text-gray-400 italic">
                                Double-click to add info
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {selectedHeaders.includes("Tag") && (
                      <TableCell
                        className=" border-none cursor-pointer"
                        onDoubleClick={() => {
                          setOpenDropdownId(contact.id); // Open dropdown on double-click
                        }}
                      >
                        <div className="flex flex-col gap-2 items-center">
                          <div className="flex flex-row flex-wrap gap-2 items-center">
                            {(() => {
                              const parsedTags =
                                typeof contact?.tag === "string"
                                  ? JSON.parse(contact.tag)
                                  : contact?.tag || [];

                              return Array.isArray(parsedTags) ? (
                                parsedTags.map((tag: string) => (
                                  <div
                                    key={tag}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md"
                                  >
                                    <div
                                      className="h-3 w-3 rounded-lg"
                                      style={{
                                        backgroundColor:
                                          tags.find((t) => t.name === tag)
                                            ?.color || "#ccc",
                                      }}
                                    />
                                    <span className="text-sm font-medium">
                                      {tag}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleRemoveTag(contact.id, tag)
                                      }
                                      className="text-xs text-red-500 hover:text-red-700"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400 italic">
                                  Double click to add tags
                                </span>
                              );
                            })()}
                          </div>

                          {/* Select Dropdown (Now opens on double-click) */}
                          <Select
                            open={openDropdownId === contact.id} // Control dropdown visibility
                            onOpenChange={(isOpen) => {
                              if (!isOpen) setOpenDropdownId(null); // Close when user clicks outside
                            }}
                            onValueChange={(value) =>
                              handleTagChange(contact.id, value)
                            }
                          >
                            {openDropdownId === contact.id && (
                              <SelectTrigger className="relative w-[180px] overflow-hidden rounded-xl border-0 bg-white px-4 py-2 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-gray-800">
                                <span className="text-sm font-medium">
                                  + Add Tag
                                </span>
                              </SelectTrigger>
                            )}

                            <SelectContent className="hidden md:flex   w-[200px] overflow-hidden rounded-xl border-0 bg-white p-2 shadow-2xl dark:bg-gray-800">
                              <div className="hidden md:flex flex-col gap-2">
                                {tags.map((tag) => (
                                  <SelectItem key={tag.name} value={tag.name}>
                                    <div className="hidden group md:flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <div className="relative">
                                        <div
                                          className="absolute -inset-1 rounded-lg opacity-20 blur-sm transition-all duration-200 group-hover:opacity-40"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        <div
                                          className="relative h-3 w-3 rounded-lg transition-transform duration-200 group-hover:scale-110"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                      </div>
                                      <span
                                        className={`text-sm font-medium ${
                                          selectedTags[contact.id]?.includes(
                                            tag.name
                                          )
                                            ? "font-bold text-blue-600"
                                            : "text-gray-700 dark:text-gray-200"
                                        }`}
                                      >
                                        {tag.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    )}
                    {selectedHeaders.includes("Address") && (
                      <TableCell
                        className=" text-center cursor-pointer relative"
                        onDoubleClick={() => {
                          setopenAddress(contact.id);
                          setAddressData({
                            address1: contact.address
                              ? contact.address.split(",")[0]
                              : "",
                            address2: contact.address
                              ? contact.address.split(",")[1]?.trim() || ""
                              : "",
                            country: contact.address
                              ? contact.address.split(",")[2]?.trim() || ""
                              : "",
                            zipCode: contact.address
                              ? contact.address.split(",")[3]?.trim() || ""
                              : "",
                          });
                        }}
                      >
                        {openAddress === contact.id ? (
                          <div className="absolute left-1/4 -translate-x-[65%]  bg-white border shadow-lg rounded-md p-4 w-[450px] z-50">
                            <div className="flex flex-row items-center mb-4">
                              <label className="block text-sm font-semibold min-w-[80px]">
                                Address 1
                              </label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                value={addressData.address1}
                                onChange={(e) =>
                                  setAddressData({
                                    ...addressData,
                                    address1: e.target.value,
                                  })
                                }
                              />

                              <label className="block text-sm font-semibold m-w-[90px]">
                                Address 2
                              </label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                value={addressData.address2}
                                onChange={(e) =>
                                  setAddressData({
                                    ...addressData,
                                    address2: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div className="flex flex-row">
                              <label className="block text-sm font-semibold mt-2">
                                Country
                              </label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                value={addressData.country}
                                onChange={(e) =>
                                  setAddressData({
                                    ...addressData,
                                    country: e.target.value,
                                  })
                                }
                              />

                              <label className="block text-sm font-semibold mt-2 min-w-[80px]">
                                ZIP Code
                              </label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                value={addressData.zipCode}
                                onChange={(e) =>
                                  setAddressData({
                                    ...addressData,
                                    zipCode: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                className="bg-gray-300 px-3 py-1 rounded"
                                onClick={() => setopenAddress({})}
                              >
                                Cancel
                              </button>
                              <button
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                                onClick={() => {
                                  handleUpdate(contact.id, {
                                    address:
                                      `${addressData.address1}, ${addressData.address2}, ${addressData.country}, ${addressData.zipCode}`.trim(),
                                  });
                                  setopenAddress({});
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">
                            {contact.address1 ? (
                              <>
                                {contact.address1}, {contact.address2},{" "}
                                {contact.country} - {contact.zipCode}
                              </>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300">
                                {contact.address ? (
                                  <>{contact.address}</>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Double-click to add address
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {contacts.length > 10 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredContacts.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredContacts.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredContacts.length}
              </span>{" "}
              contacts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.ceil(filteredContacts.length / itemsPerPage) },
                (_, i) => i + 1
              )
                .filter(
                  (page) =>
                    page === 1 ||
                    page === Math.ceil(filteredContacts.length / itemsPerPage) ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-muted-foreground mx-1">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(
                  Math.min(
                    Math.ceil(filteredContacts.length / itemsPerPage),
                    currentPage + 1
                  )
                )
              }
              disabled={
                currentPage ===
                Math.ceil(filteredContacts.length / itemsPerPage)
              }
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="36">36</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
      )}
    </div>
  );
}
