"use client";
import { Filter, Loader2, UserIcon } from "lucide-react";
import FilterComponent from "./filter";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  FileDown,
  FileUp,
  Phone,
  MessageCircle,
  Send,
  Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CRM_MESSAGES } from "@/lib/constant/crm";
import { useGetLeadsByWorkspaceQuery, useUpdateLeadMutation, useUpdateLeadDataMutation, useAssignRoleMutation, useBulkDeleteLeadsMutation, useCreateLeadMutation } from "@/lib/store/services/leadsApi";
import { useGetActiveWorkspaceQuery, useGetWorkspaceMembersQuery } from "@/lib/store/services/workspace";
import { useGetStatusQuery } from "@/lib/store/services/status";
import { CardDescription } from "@/components/ui/card";
import { calculateDaysAgo } from "@/utils/diffinFunc";
import { toggleCollapse, setCollapse } from "@/lib/store/slices/sideBar";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { X } from "lucide-react";
import { formatDate } from "@/utils/date";
// Zod validation schema for lead
const leadSchema = z.object({
  name: z.string().min(2, { message: "First name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
  company: z.string().optional(),
  position: z.string().optional(),
  contact_method: z.enum(["WhatsApp", "SMS", "Call"], {
    required_error: "Please select a contact method",
  }),
  revenue: z.number().optional(),
});

const initialFilters: any = {
  owner: "",
  status: "",
  contact_method: "",
  contactType: "",
  startDate: "",
  endDate: "",
  showDuplicates: false,
};

const LeadManagement: React.FC = () => {
  const isCollapsed = useSelector((state: RootState) => state.sidebar.isCollapsed);
  const [createLead, { isLoading: isCreateLoading, error: leadCreateError }] = useCreateLeadMutation();
  const [updateLeadData, { isLoading: isUpdateLoading, error: leadUpdateError }] = useUpdateLeadDataMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [assignRole, { isLoading: isAssignLoading, error: roleAssignError }] = useAssignRoleMutation();
  const [deleteLeadsData] = useBulkDeleteLeadsMutation();
  const { data: activeWorkspace, isLoading: isLoadingWorkspace } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;
  const { data: workspaceData, isLoading: isLoadingLeads }: any = useGetLeadsByWorkspaceQuery(
    workspaceId
      ? ({ workspaceId: workspaceId.toString() } as { workspaceId: string }) // Provide workspaceId if it exists
      : ({} as { workspaceId: string }), // Fallback empty object if workspaceId is undefined
    {
      skip: !workspaceId || isLoadingWorkspace, // Skip fetching if workspaceId is missing or loading
    }
  );
  const { data: workspaceMembers, isLoading: isLoadingMembers } = useGetWorkspaceMembersQuery(workspaceId);
  const { data: statusData, isLoading: isLoadingStatus }: any = useGetStatusQuery(workspaceId);
  useEffect(() => {
    const fetchLeads = () => {
      if (!isLoadingLeads && workspaceData?.data) {
        const fetchedLeads = workspaceData?.data
          .map((lead: any, index: number) => ({
            id: lead.id || index + 1,
            Name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            company: lead.company || "",
            position: lead.position || "",
            contact_method: lead.contact_method,
            owner: lead.owner || "Unknown",
            status: lead.status || "New",
            revenue: lead.revenue || 0,
            assign_to: lead.assign_to || "Not Assigned",
            createdAt: lead.created_at ? new Date(lead.created_at).toISOString() : new Date().toISOString(),
            isDuplicate: false, // Ensure valid date format 
            is_email_valid: lead.is_email_valid,
            is_phone_valid: lead.is_phone_valid
          }))
        const duplicates = new Set();
        fetchedLeads.forEach((lead: any) => {
          const duplicate = fetchedLeads.find(
            (l: any) => l.id !== lead.id && (l.email === lead.email || l.phone === lead.phone)
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
        setLeads(
          updatedLeads.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    };
    // Initial fetch
    fetchLeads();

  }, [workspaceData, isLoadingLeads]);
  console.log(activeWorkspace);

  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);


  const [filters, setFilters] = useState<any>(initialFilters);
  const [leads, setLeads] = useState<any[]>([]);



  const handleFilterReset = () => {
    setFilters(initialFilters);
    setShowFilters(false);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (searchQuery) {
        const searchText = searchQuery.toLowerCase();
        const searchableFields = [
          lead.Name,
          lead.email,
          lead.phone,
          lead.company,
          lead.position,
          lead.status?.name,
          lead.assign_to?.name
        ];

        const matchesSearch = searchableFields.some(
          field => field && field.toString().toLowerCase().includes(searchText)
        );

        if (!matchesSearch) return false;
      }
      // Owner filter
      if (filters.owner && !lead.assign_to.name?.includes(filters.owner)) return false;

      // Status filter (Fixing the bug where old data persists)
      if (filters.status && lead.status?.name !== filters.status) return false;

      // Contact Method filter
      if (filters.contact_method && lead.contact_method !== filters.contact_method) return false;

      // Contact Type filter (Ensure it checks correct field)
      if (filters.contactType) {
        if (filters.contactType === "phone" && !lead.phone) return false;
        if (filters.contactType === "email" && !lead.email) return false;
        if (filters.contactType === "id" && !lead.id) return false;
      }

      // Date range filter
      if (filters.startDate && new Date(lead.createdAt) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(lead.createdAt) > new Date(filters.endDate)) return false;

      // Duplicate check
      if (filters.showDuplicates) {
        const duplicates = leads.filter((l) => l.email === lead.email || l.phone === lead.phone);
        if (duplicates.length <= 1) return false;
      }

      return true;
    });
  }, [leads, filters, searchQuery]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [dialogMode, setDialogMode] = useState<
    "create" | "edit" | "delete" | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLead, setEditingLead] = useState<any>(null);

  // Pagination
  const leadsPerPage = 10;
  const totalPages = Math.ceil(leads.length / leadsPerPage);

  // Paginated leads
  // const paginatedLeads = useMemo(() => {
  //   const startIndex = (currentPage - 1) * leadsPerPage;
  //   return leads.slice(startIndex, startIndex + leadsPerPage);
  // }, [leads, currentPage]);

  const paginatedLeads = leads
  // Form setup
  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      contact_method: undefined,
      revenue: 0,

    },
  });

  // Reset dialog state
  const resetDialog = () => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      contact_method: undefined,
      revenue: 0,
    })
    setEditingLead(null);
    setDialogMode(null);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetDialog();
    setDialogMode("create");
  };

  // Open edit dialog
  const openEditDialog = (lead: any) => {
    form.reset({
      name: lead.Name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.position,
      contact_method: lead.contact_method,
      revenue: lead.revenue,
    });
    setEditingLead(lead);
    setDialogMode("edit");
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof leadSchema>) => {
    if (dialogMode === "create") {
      // Add new lead
      try {
        await createLead({ workspaceId: workspaceId, body: data });
        setLeads([
          ...leads,
          {
            ...data,
            company: data.company || "",
            position: data.position || "",
            revenue: data.revenue || 0,
          },
        ]);
      } catch (error) {
        console.log(error);
      }

      resetDialog();
    } else if (dialogMode === "edit" && editingLead) {
      // Update existing lead
      try {
        updateLeadData({ id: editingLead.id, leads: data });
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === editingLead.id
              ? { ...lead, ...data, company: data.company || "", position: data.position || "", revenue: data.revenue || 0 }
              : lead
          )
        );
        setEditingLead(null);
      } catch (error) {
        console.error("Error updating lead", error);
        toast.error(CRM_MESSAGES.LEAD_UPDATED_ERROR);
      }
    }
    toast.success(CRM_MESSAGES.LEAD_UPDATED_SUCCESS);
    resetDialog();
  };

  // Delete selected leads
  const handleDelete = async () => {
    try {
      const response = await deleteLeadsData({
        id: selectedLeads,
        workspaceId: workspaceId
      }).unwrap(); // Add .unwrap() for RTK Query

      setLeads(leads.filter((lead) => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      setDialogMode(null);
      toast.success("Selected leads deleted successfully");
    } catch (error: any) {
      // Log the error to see its structure
      console.error('Delete error:', error);

      // RTK Query specific error handling
      const errorMessage =
        error.data?.message ||
        error.data?.error ||
        error.error ||
        "Failed to delete leads";

      toast.error(errorMessage);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Deselect all leads
  const deselectAll = () => {
    setSelectedLeads([]);
  };

  // Select all leads on current page
  const toggleSelectAllOnPage = () => {
    const currentPageLeadIds = paginatedLeads.map((lead) => lead.id);
    const allSelected = currentPageLeadIds.every((id) =>
      selectedLeads.includes(id)
    );

    setSelectedLeads((prev) =>
      allSelected
        ? prev.filter((id) => !currentPageLeadIds.includes(id))
        : Array.from(new Set([...prev, ...currentPageLeadIds]))
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "leads_export.csv");
  };

  // Export to JSON
  const exportToJSON = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "leads_export.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Import leads
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Validate imported data against schema
        const validLeads = data.filter((lead: any) => {
          try {
            leadSchema.parse(lead);
            return true;
          } catch {
            return false;
          }
        });

        setLeads((prev) => [
          ...prev,
          ...validLeads.map((lead: any) => ({
            ...lead,
            id: prev.length + validLeads.indexOf(lead) + 1,
          })),
        ]);
      } catch (error) {
        console.error("Invalid file format", error);
        alert("Invalid file format. Please upload a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

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
  const handleView = (id: number) => {
    router.push(`/leads/${id}`);
  };

  const handleStatusChange = async (id: number, value: string) => {
    const { name, color } = JSON.parse(value);

    try {
      await updateLead({ id, leads: { name, color } });

      // Update the leads state with the new status
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === id
            ? {
              ...lead,
              status: {
                name,
                color
              }
            }
            : lead
        )
      );

      toast.success(`Lead status updated to ${name}`);
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleAssignChange = async (id: number, assign: string) => {
    const { name, role } = JSON.parse(assign);

    try {
      await assignRole({ id, data: { name, role } });

      // Update the leads state with the new assignment
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === id
            ? {
              ...lead,
              assign_to: {
                name,
                role
              }
            }
            : lead
        )
      );

      toast.success(`Lead assigned to ${name}`);
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead');
    }
  };
  const handleGoBack = () => {
    router.push("/dashboard");
  }
  if (workspaceData?.data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-lg w-full p-8 bg-white shadow-xl rounded-lg flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold text-center text-gray-800">
            No Leads Found in this Workspace
          </CardTitle>

          <CardDescription className="mt-2 text-lg text-gray-600 text-center">
            It seems there are no leads available in this workspace at the moment.
          </CardDescription>
          <Button
            className="mt-6 px-6 py-2 bg-primary text-white rounded-md shadow-md hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={handleGoBack}
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  if (isLoadingStatus || isLoadingLeads || isLoadingMembers) return <div className="flex items-center justify-center min-h-screen overflow-hidden">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>;
  return (
    <div
      className={`transition-all duration-300 px-4 py-6 
    ${isCollapsed ? "lg:ml-[80px] md:ml-[80px]" : "lg:ml-[250px] md:ml-[250px]"} w-auto`}
    >
      <Card className="w-full overflow-hidden">
        {showFilters && (
          <FilterComponent
            values={filters}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
            status={statusData?.data}
            owner={workspaceMembers?.data}
          />
        )}

        <CardHeader className="flex flex-col space-y-3 p-3 sm:p-6">
          <CardTitle className="text-lg md:text-xl lg:text-2xl">
            Lead Management
          </CardTitle>

          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-grow sm:flex-grow-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">
                {showFilters ? "Hide Filters" : "Show Filters"}
              </span>
            </Button>

            <input
              type="file"
              id="import-leads"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="flex-grow sm:flex-grow-0"
                onClick={exportToCSV}
              >
                <FileDown className="mr-2 h-4 w-4" /> CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-grow sm:flex-grow-0"
                onClick={exportToJSON}
              >
                <FileDown className="mr-2 h-4 w-4" /> JSON
              </Button>
            </div>

            <Button
              className="w-full sm:w-auto"
              size="sm"
              onClick={openCreateDialog}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-6">
          {/* Delete Selected Button */}
          {selectedLeads.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-grow sm:flex-grow-0"
                onClick={() => setDialogMode("delete")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedLeads.length} Selected
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-grow sm:flex-grow-0"
                onClick={deselectAll}
              >
                <X className="mr-2 h-4 w-4" />
                Deselect All
              </Button>
            </div>
          )}

          {/* Responsive Table for mobile view */}
          <div className="block md:hidden">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="mb-4 p-3 border rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">{lead.Name}</div>
                      {lead.isDuplicate && (
                        <span className="text-red-500 text-xs">
                          Duplicate Lead
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => initiateDirectContact(lead, lead.contact_method)}
                      className="h-6 w-6"
                      title={`Contact via ${lead.contact_method}`}
                    >
                      {lead.contact_method === "WhatsApp" && <Send className="h-3 w-3" />}
                      {lead.contact_method === "Call" && <Phone className="h-3 w-3" />}
                      {lead.contact_method === "SMS" && <MessageCircle className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(lead)}
                      className="h-6 w-6"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleView(lead.id)}
                      className="h-6 w-6"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold min-w-[80px]">Email:</span>
                    <div className="flex items-center">
                      {lead.is_email_valid ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] mr-1" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 stroke-[3] mr-1" />
                      )}
                      <span className={`${lead.is_email_valid ? 'text-emerald-800' : 'text-red-800'}`}>
                        {lead.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold min-w-[80px]">Phone:</span>
                    <div className="flex items-center">
                      {lead.is_phone_valid ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] mr-1" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 stroke-[3] mr-1" />
                      )}
                      <span className={`${lead.is_phone_valid ? 'text-emerald-800' : 'text-red-800'}`}>
                        {lead.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold min-w-[80px]">Created:</span>
                    <span>{formatDate(lead.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold min-w-[80px]">Status:</span>
                    <Select
                      defaultValue={JSON.stringify({
                        name: lead.status?.name || "Pending",
                        color: lead.status?.color || "#ea1212",
                      })}
                      onValueChange={(value) => handleStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="h-8 w-full max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="relative h-3 w-3 rounded-lg" style={{ backgroundColor: lead?.status?.color }} />
                          <span className="text-xs">{lead?.status?.name}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {statusData?.data.map((status: any) => (
                          <SelectItem
                            key={status.name}
                            value={JSON.stringify({ name: status?.name, color: status?.color })}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-lg" style={{ backgroundColor: status?.color }} />
                              <span>{status.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold min-w-[80px]">Assign:</span>
                    <Select
                      defaultValue={JSON.stringify({
                        name: lead?.assign_to?.name || "Not Assigned",
                        role: lead?.assign_to?.role || "(Not Assigned)",
                      })}
                      onValueChange={(value) => handleAssignChange(lead?.id, value)}
                    >
                      <SelectTrigger className="h-8 w-full max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs">{lead?.assign_to?.name || "Not Assigned"}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          key="unassigned"
                          value={JSON.stringify({ name: "Unassigned", role: "none" })}
                        >
                          <span>Unassigned</span>
                        </SelectItem>
                        {workspaceMembers?.data.map((member: any) => (
                          <SelectItem
                            key={member.name}
                            value={JSON.stringify({ name: member?.name, role: member?.role })}
                          >
                            <span>{member.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block text-xs">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-1">
                      <Checkbox
                        checked={
                          paginatedLeads.length > 0 &&
                          paginatedLeads.every((lead) =>
                            selectedLeads.includes(lead.id)
                          )
                        }
                        onCheckedChange={toggleSelectAllOnPage}
                      />
                    </TableHead>
                    <TableHead className="px-2 py-1">Name</TableHead>
                    <TableHead className="px-2 py-1">Email</TableHead>
                    <TableHead className="px-2 py-1">Phone</TableHead>
                    <TableHead className="px-2 py-1">Generated At</TableHead>
                    <TableHead className="px-2 py-1">Actions</TableHead>
                    <TableHead className="px-2 py-1">Status</TableHead>
                    <TableHead className="px-2 py-1">Assign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="px-2 py-1">
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {lead.Name}
                        <br />
                        {lead.isDuplicate && (
                          <span style={{ color: "red", fontSize: "0.7em" }}>
                            Duplicate Lead
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center space-x-2">
                          {lead.is_email_valid ? (
                            <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 stroke-[3]" />
                          )}
                          <div>
                            <span className={`
                            font-medium tracking-tight 
                            ${lead.is_email_valid
                                ? 'text-emerald-800'
                                : 'text-red-800'
                              }`}
                            >
                              {lead.email}
                            </span>
                            {!lead.is_email_valid && (
                              <div className="text-xs text-red-600 mt-0.5">
                                Invalid Email
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center space-x-2">
                          {lead.is_phone_valid ? (
                            <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 stroke-[3]" />
                          )}
                          <div>
                            <span className={`
                            font-medium tracking-tight 
                            ${lead.is_phone_valid
                                ? 'text-emerald-800'
                                : 'text-red-800'
                              }`}
                            >
                              {lead.phone}
                            </span>
                            {!lead.is_phone_valid && (
                              <div className="text-xs text-red-600 mt-0.5">
                                Invalid Phone
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1">{formatDate(lead.createdAt)}</TableCell>
                      <TableCell className="px-2 py-1">
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              initiateDirectContact(lead, lead.contact_method)
                            }
                            className="h-6 w-6"
                            title={`Contact via ${lead.contact_method}`}
                          >
                            {lead.contact_method === "WhatsApp" && (
                              <Send className="h-3 w-3" />
                            )}
                            {lead.contact_method === "Call" && (
                              <Phone className="h-3 w-3" />
                            )}
                            {lead.contact_method === "SMS" && (
                              <MessageCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(lead)}
                            className="h-6 w-6"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleView(lead.id)}
                            className="h-6 w-6"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <Select
                          defaultValue={JSON.stringify({
                            name: lead.status?.name || "Pending",
                            color: lead.status?.color || "#ea1212",
                          })}
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger
                            className="group relative w-[200px] overflow-hidden rounded-xl border-0 bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="absolute -inset-1 rounded-lg bg-gray-400 opacity-20 blur-sm transition-opacity duration-200 group-hover:opacity-30" style={{ backgroundColor: lead?.status?.color }} />
                                <div className="relative h-3 w-3 rounded-lg bg-gray-400" style={{ backgroundColor: lead?.status?.color }} />
                              </div>
                              <span className="text-sm font-medium">{lead?.status?.name}</span>
                            </div>
                          </SelectTrigger>

                          <SelectContent className="overflow-hidden rounded-xl border-0 bg-white p-2 shadow-2xl dark:bg-gray-800">
                            {statusData?.data.map((status: any) => (
                              <SelectItem
                                key={status.name}
                                value={JSON.stringify({ name: status?.name, color: status?.color })}
                                className="cursor-pointer rounded-lg outline-none transition-colors focus:bg-transparent"
                              >
                                <div className="group flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <div className="relative">
                                    {/* Glow effect */}
                                    <div
                                      className="absolute -inset-1 rounded-lg opacity-20 blur-sm transition-all duration-200 group-hover:opacity-40"
                                      style={{ backgroundColor: status?.color }}
                                    />
                                    {/* Main dot */}
                                    <div
                                      className="relative h-3 w-3 rounded-lg transition-transform duration-200 group-hover:scale-110"
                                      style={{ backgroundColor: status?.color }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {status.name}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border-none">
                        <Select
                          defaultValue={JSON.stringify({
                            name: lead?.assign_to?.name || "Not Assigned",
                            role: lead?.assign_to?.role || "(Not Assigned)",
                          })}
                          onValueChange={(value) => handleAssignChange(lead?.id, value)}
                        >
                          <SelectTrigger
                            className="group relative w-[200px] overflow-hidden rounded-xl border-0 bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="absolute -inset-1 rounded-lg bg-gray-400 opacity-20 blur-sm transition-opacity duration-200 group-hover:opacity-30" />
                                <div className="relative">
                                  <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              </div>
                              <span className="text-sm font-medium">{lead?.assign_to?.name}</span>
                            </div>
                          </SelectTrigger>

                          <SelectContent className="overflow-hidden rounded-xl border-0 bg-white p-2 shadow-2xl dark:bg-gray-800">
                            <SelectItem
                              key="unassigned"
                              value={JSON.stringify({ name: "Unassigned", role: "none" })}
                              className="cursor-pointer rounded-lg outline-none transition-colors focus:bg-transparent"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                  Unassigned
                                </span>
                              </div>
                            </SelectItem>
                            {workspaceMembers?.data.map((status: any) => (
                              <SelectItem
                                key={status.name}
                                value={JSON.stringify({ name: status?.name, role: status?.role })}
                                className="cursor-pointer rounded-lg outline-none transition-colors focus:bg-transparent"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {status.name}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs - Adjusted for mobile */}
      <Dialog
        open={dialogMode === "create" || dialogMode === "edit"}
        onOpenChange={() => resetDialog()}
      >
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Add New Lead" : "Edit Lead"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Your Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contact_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter revenue"
                        type="number"
                        {...field}
                        value={field.value ? String(field.value) : ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                  {isUpdateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : dialogMode === "create" ? "Add Lead" : "Update Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Adjusted for mobile */}
      <Dialog
        open={dialogMode === "delete"}
        onOpenChange={() => setDialogMode(null)}
      >
        <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Delete Selected Leads</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedLeads?.length} lead(s)?</p>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;