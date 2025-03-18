"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Edit, Trash, Send, Mail, MessageSquare, Phone } from "lucide-react";

// Form schema for validation
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.enum(["email", "sms", "whatsapp", "phone"], {
    errorMap: () => ({ message: "Invalid campaign type" }),
  }),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"], {
    errorMap: () => ({ message: "Invalid campaign status" }),
  }).default("draft"),
  content: z.string().optional(),
  template_id: z.string().optional(),
  scheduled_at: z.date().optional(),
  recipient_leads: z.array(z.string()).min(1, "At least one recipient is required"),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";

const MarketingCampaignsPage = () => {
  const router = useRouter();
  const isCollapsed = useSelector((state: RootState) => state.sidebar.isCollapsed);
  const { data: activeWorkspace, isLoading: isWorkspaceLoading } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Form hook
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "email",
      status: "draft",
      content: "",
      template_id: "none",
      recipient_leads: [],
    },
  });

  // Watch for type changes to filter templates
  const campaignType = form.watch("type");
  const templateId = form.watch("template_id");

  // Fetch campaigns, templates, and leads when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchCampaigns();
      fetchTemplates();
      fetchLeads();
    }
  }, [workspaceId]);

  // Update selected template when template_id changes
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find((t) => t.id === templateId);
      setSelectedTemplate(template);
      
      if (template) {
        form.setValue("content", template.content);
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [templateId, templates, form]);

  // Fetch all campaigns for the current workspace
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing/campaigns?workspace_id=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all templates for the current workspace
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/marketing/templates?workspace_id=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  // Fetch all leads for the current workspace
  const fetchLeads = async () => {
    try {
      const response = await fetch(`/api/leads?workspace_id=${workspaceId}&page=1&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    }
  };

  // Open dialog for creating a new campaign
  const openCreateDialog = () => {
    form.reset({
      name: "",
      type: "email",
      status: "draft",
      content: "",
      template_id: "none",
      recipient_leads: [],
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  // Open dialog for editing an existing campaign
  const openEditDialog = async (campaignId: string) => {
    try {
      setLoading(true);
      
      // Fetch the campaign details
      const response = await fetch(`/api/marketing/campaigns?workspace_id=${workspaceId}&id=${campaignId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }
      
      const data = await response.json();
      const campaign = data.campaign;
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      
      // Extract recipient lead IDs
      const recipientLeadIds = campaign.campaign_recipients.map((recipient: any) => recipient.lead_id);
      
      // Convert scheduled_at string to Date if it exists
      const scheduledAt = campaign.scheduled_at ? new Date(campaign.scheduled_at) : undefined;
      
      // Reset form with campaign data
      form.reset({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        content: campaign.content || "",
        template_id: campaign.template_id || "none",
        scheduled_at: scheduledAt,
        recipient_leads: recipientLeadIds,
      });
      
      setEditingId(campaignId);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error loading campaign for edit:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  // Create or update a campaign
  const onSubmit = async (values: CampaignFormValues) => {
    try {
      setLoading(true);
      
      // Convert 'none' template_id to null
      const formData = {
        ...values,
        workspace_id: workspaceId,
        template_id: values.template_id === 'none' ? null : values.template_id,
      };
      
      // Format the scheduled_at date
      const formattedValues = {
        ...formData,
        scheduled_at: formData.scheduled_at ? formData.scheduled_at.toISOString() : undefined,
      };
      
      let response;
      if (editingId) {
        // Update existing campaign
        response = await fetch(`/api/marketing/campaigns?id=${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedValues),
        });
      } else {
        // Create new campaign
        response = await fetch('/api/marketing/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedValues),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }
      
      toast.success(editingId ? 'Campaign updated successfully' : 'Campaign created successfully');
      
      // Close dialog and refresh the campaigns list
      setDialogOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  // Delete a campaign
  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing/campaigns?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
      
      toast.success('Campaign deleted successfully');
      
      // Refresh the campaigns list
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  // Send a campaign
  const sendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign now? This will send messages to all recipients.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing/campaigns?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }
      
      toast.success('Campaign is now being sent');
      
      // Refresh the campaigns list
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered campaigns based on active tab
  const getFilteredCampaigns = () => {
    if (activeTab === 'all') {
      return campaigns;
    }
    return campaigns.filter(campaign => campaign.status === activeTab);
  };

  // Get campaign type icon
  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  // Get campaign status badge
  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please select a workspace to continue</p>
      </div>
    );
  }

  return (
    <div
      className={`grid align-center gap-0 md:gap-2 md:rounded-none rounded-[4px] transition-all duration-500 ease-in-out px-2 py-6 w-auto 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden`}
    >
      <Card className="w-full rounded-[16px] md:rounded-[4px] overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
          <div>
            <CardTitle className="text-sm md:text-xl lg:text-2xl gradient-heading">
              Marketing Campaigns
            </CardTitle>
            <CardDescription>
              Create and manage your marketing campaigns
            </CardDescription>
          </div>
          <Button variant="accent" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {loading && campaigns.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader size="lg" variant="primary" />
                </div>
              ) : getFilteredCampaigns().length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">No campaigns found</p>
                  <Button variant="accent" onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredCampaigns().map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getCampaignTypeIcon(campaign.type)}
                            <span className="ml-2 capitalize">{campaign.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCampaignStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell>{campaign.recipient_count}</TableCell>
                        <TableCell>
                          {campaign.scheduled_at 
                            ? format(new Date(campaign.scheduled_at), 'PPP p')
                            : 'Not scheduled'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {campaign.status === 'draft' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => sendCampaign(campaign.id)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(campaign.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteCampaign(campaign.id)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Campaign Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
                <DialogDescription>
                  {editingId 
                    ? "Update the details of your marketing campaign." 
                    : "Create a new marketing campaign to reach your leads."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Spring Sale Announcement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="template_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Template</SelectItem>
                              {templates
                                .filter(template => template.type === campaignType)
                                .map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select a template or create your own content below
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduled_at"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Schedule</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && "text-muted-foreground"
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP p")
                                  ) : (
                                    <span>Pick a date and time</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                              <div className="p-3 border-t border-border">
                                <Input
                                  type="time"
                                  onChange={(e) => {
                                    const date = field.value || new Date();
                                    const [hours, minutes] = e.target.value.split(':');
                                    date.setHours(parseInt(hours, 10));
                                    date.setMinutes(parseInt(minutes, 10));
                                    field.onChange(date);
                                  }}
                                  value={field.value 
                                    ? `${field.value.getHours().toString().padStart(2, '0')}:${field.value.getMinutes().toString().padStart(2, '0')}`
                                    : ''
                                  }
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Leave empty to send immediately
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your campaign content here..." 
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {campaignType === 'email' 
                            ? 'You can use HTML for email campaigns' 
                            : campaignType === 'sms' || campaignType === 'whatsapp'
                            ? 'Keep messages concise for better delivery rates'
                            : 'Enter a script for phone calls'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipient_leads"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipients</FormLabel>
                        <div className="border rounded-md p-4">
                          <div className="mb-2 flex flex-wrap gap-2">
                            {field.value.length > 0 ? (
                              field.value.map((leadId) => {
                                const lead = leads.find((l) => l.id === leadId);
                                return lead ? (
                                  <Badge key={leadId} variant="secondary" className="py-1">
                                    {lead.name}
                                    <button
                                      type="button"
                                      className="ml-1 text-xs"
                                      onClick={() => {
                                        field.onChange(field.value.filter((id) => id !== leadId));
                                      }}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ) : null;
                              })
                            ) : (
                              <div className="text-muted-foreground text-sm">No recipients selected</div>
                            )}
                          </div>
                          <Select 
                            onValueChange={(value) => {
                              if (!field.value.includes(value)) {
                                field.onChange([...field.value, value]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add recipients" />
                            </SelectTrigger>
                            <SelectContent>
                              {leads
                                .filter((lead) => !field.value.includes(lead.id))
                                .map((lead) => (
                                  <SelectItem key={lead.id} value={lead.id}>
                                    {lead.name} ({lead.email})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormDescription>
                          Select the leads who will receive this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="accent">
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCampaignsPage;
