"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  Calendar,
  Database,
  Loader2,
  ChevronLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useGetLeadByIdQuery, useAddNotesMutation } from "@/lib/store/services/leadsApi";
import { formatDate } from "@/utils/date";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from "@/lib/supabaseClient";
import { useUpdateLeadMutation } from "@/lib/store/services/leadsApi";
import { toast } from "sonner";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";
import { useGetStatusQuery } from "@/lib/store/services/status";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { extractUserNameAndTimestamp } from "@/utils/message";
import { Player } from "@lottiefiles/react-lottie-player";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

const IndividualLeadPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const isCollapsed = useSelector((state: RootState) => state.sidebar.isCollapsed);
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});
  const [updateLead] = useUpdateLeadMutation();
  const [addNotes] = useAddNotesMutation();
  const leadId = params?.id as string;
  const { data: leadsData, isLoading, error } = useGetLeadByIdQuery({ id: leadId }, {
    pollingInterval: 2000, // 2 seconds
  });
  const currentLead = leadsData?.data?.[0];
  const [newNote, setNewNote] = useState("");
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Array<{ message: string }>>([]);
  const { data: activeWorkspace, isLoading: isLoadingWorkspace } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data.id;
  // Type the notes state properly
  const { data: statusData, isLoading: isLoadingStatus }: any = useGetStatusQuery(workspaceId);

  useEffect(() => {
    // Set initial notes when lead data loads
    if (currentLead?.text_area) {
      setNotes(currentLead.text_area);
    }
  }, [currentLead]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user?.user_metadata);
    };

    fetchUser();
  }, []);

  const handleGoBack = () => {
    router.push("/leads");
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardTitle className="text-red-500">Error loading lead data</CardTitle>
          <CardDescription>Please try again later</CardDescription>
          <Button className="mt-4" onClick={handleGoBack}>Back to Leads</Button>
        </Card>
      </div>
    );
  }

  // Show not found state
  if (!currentLead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardTitle>Lead not found</CardTitle>
          <CardDescription>The requested lead could not be found</CardDescription>
          <Button className="mt-4" onClick={handleGoBack}>Back to Leads</Button>
        </Card>
      </div>
    );
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      const author = user?.firstName || user?.name || "Unknown";
      const timestamp = new Date().toLocaleString(); // Or use .toISOString() for a standard format
      const newNoteText = `${newNote} (added by ${author} at ${timestamp})`;
      const newNoteObj = { message: newNoteText };
      const updatedNotes = [...notes, newNoteObj];

      setNotes(updatedNotes);
      setNewNote("");
      addNotes({ id: leadId, Note: updatedNotes });
    }
  };

  const handleStatusChange = async (id: number, value: string) => {
    const { name, color } = JSON.parse(value);

    try {
      updateLead({ id, leads: { name, color } });
      toast.success(`Lead status updated to ${name}`);
    } catch (error) {
      toast.error("Failed to update lead status");
    }
  };

  const truncate = (text: string, length = 50) => {
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  // Toggle the expanded state
  const handleToggle = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const result = extractUserNameAndTimestamp(notes.map(note => note?.message));
  const sanitizedPhone = currentLead?.phone.replace(/\D/g, "");

  return (
    <div
      className={`transition-all duration-300 px-4 py-6 
  ${isCollapsed ? "lg:ml-[80px] md:ml-[80px]" : "lg:ml-[250px] md:ml-[250px]"} w-auto`}
    >
      <Card className="w-full">
        <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="sm:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg sm:text-xl truncate max-w-[180px] sm:max-w-none">
                  {currentLead?.name}
                </CardTitle>
              </div>

              <div className="flex sm:hidden items-center gap-2">
                <button className="p-1" onClick={() => { window.open(`tel:${currentLead?.phone}`, "_blank"); }}>
                  <Player
                    autoplay
                    loop
                    src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736332984/Call_o3ga1m.json"
                    className="fixed-player"
                    style={{ width: '40px' }}
                  />
                </button>
                <button className="p-1" onClick={() => { window.open(`https://wa.me/${sanitizedPhone}`, "_blank"); }}>
                  <Player
                    autoplay
                    loop
                    src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736331912/Whatsapp_vemsbg.json"
                    className="fixed-player"
                    style={{ width: '40px' }}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <CardDescription className="my-0 sm:my-4">
                <Badge>{currentLead?.lead_source_id}</Badge>
              </CardDescription>
              <button className="hidden sm:block" onClick={() => { window.open(`tel:${currentLead?.phone}`, "_blank"); }}>
                <Player
                  autoplay
                  loop
                  src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736332984/Call_o3ga1m.json"
                  className="fixed-player"
                  style={{ width: '50px' }}
                />
              </button>
              <button className="hidden sm:block p-2 rounded-full hover:bg-gray-100" onClick={() => { window.open(`https://wa.me/${sanitizedPhone}`, "_blank"); }}>
                <Player
                  autoplay
                  loop
                  src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736331912/Whatsapp_vemsbg.json"
                  className="fixed-player"
                  style={{ width: '50px' }}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="hidden sm:flex"
            >
              Back to Leads
            </Button>
            <Select
              defaultValue={JSON.stringify({
                name: currentLead?.status?.name || "Pending",
                color: currentLead?.status?.color || "#ea1212",
              })}
              onValueChange={(value) => handleStatusChange(currentLead.id, value)}
            >
              <SelectTrigger
                className="group relative w-full sm:w-[200px] overflow-hidden rounded-md border-0 bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-gray-800"
                style={{ outline: `2px solid ${currentLead?.status?.color || 'gray'}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="absolute -inset-1 rounded-lg bg-gray-400 opacity-20 blur-sm transition-opacity duration-200 group-hover:opacity-30"
                      style={{ backgroundColor: currentLead?.status?.color }}
                    />
                    <div
                      className="relative h-3 w-3 rounded-lg bg-gray-400"
                      style={{ backgroundColor: currentLead?.status?.color }}
                    />
                  </div>
                  <span className="text-sm font-medium">{currentLead?.status?.name}</span>
                </div>
              </SelectTrigger>

              <SelectContent className="overflow-hidden rounded-xl border-0 bg-white p-2 shadow-2xl dark:bg-gray-800">
                {statusData?.data.map((status: { name: string; color: string }) => (
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
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="mr-2 text-gray-500" size={18} />
                        <span className="text-sm sm:text-base overflow-hidden overflow-ellipsis">{currentLead?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-2 text-gray-500" size={18} />
                        <span className="text-sm sm:text-base">{currentLead?.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-2 text-gray-500" size={18} />
                        <span className="text-sm sm:text-base">{formatDate(currentLead?.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentLead?.custom_data && (
                      <Card className="relative border-border/40">
                        <CardContent className="p-2 sm:p-4 pt-0">
                          <ScrollArea className="h-[250px] sm:h-[400px] pr-2 sm:pr-4">
                            <div className="w-full max-w-2xl mx-auto space-y-2">
                              {Object.entries(currentLead?.custom_data || {}).map(([question, answer], index) => (
                                <Card key={index} className="border-0 shadow-none bg-accent/40 hover:bg-accent/60 transition-colors">
                                  <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value={`item-${index}`} className="border-0">
                                      <AccordionTrigger
                                        className="py-2 sm:py-4 px-2 sm:px-4 hover:no-underline"
                                        onClick={() => handleToggle(index)}
                                      >
                                        <div className="flex text-left items-start justify-start w-full">
                                          <span className="text-sm sm:text-base text-left font-medium whitespace-normal break-words">
                                            {expandedItems[index] ? question : truncate(question, 30)}
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-2 sm:px-4 pb-3 sm:pb-4 pt-1">
                                        <p className="text-[12px] sm:text-[14px] text-gray-800 leading-relaxed bg-white p-2 rounded-md shadow-sm">
                                          {answer as string}
                                        </p>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 sm:mt-6 flex items-center space-x-4">
                <Badge variant="secondary" style={{ backgroundColor: currentLead?.status?.color }}>
                  Status: {currentLead?.status?.name || "Pending"}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="interactions">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* Table body would go here */}
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="mb-4">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a new note..."
                      rows={4}
                      className="w-full resize-vertical text-sm sm:text-base"
                    />
                    <Button
                      onClick={handleAddNote}
                      className="mt-2 w-full sm:w-auto"
                      variant="default"
                    >
                      Add Note
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:gap-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-1 sm:gap-2 bg-primary text-white p-2 sm:p-4 rounded-lg text-xs sm:text-sm">
                      <div className="col-span-3 sm:col-span-4 font-semibold">Author</div>
                      <div className="col-span-5 sm:col-span-4 font-semibold pl-1 sm:pl-2">Message</div>
                      <div className="col-span-4 font-semibold text-right">Timestamp</div>
                    </div>

                    {/* Notes */}
                    <div className="max-h-[300px] sm:max-h-none overflow-y-auto pr-1">
                      {result.map((noteItem, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div className="group grid grid-cols-12 gap-1 sm:gap-2 items-center rounded-lg border border-border bg-card p-2 sm:p-4 transition-all duration-200 hover:bg-accent hover:border-accent mb-2">
                              <div className="col-span-3 sm:col-span-4 text-xs sm:text-sm text-muted-foreground truncate">
                                {noteItem?.userName || "Not Added"}
                              </div>
                              <div className="col-span-5 sm:col-span-4 text-xs sm:text-sm text-muted-foreground break-all pl-1 sm:pl-2 truncate">
                                {noteItem?.message || "Not Added"}
                              </div>
                              <div className="col-span-4 text-xs sm:text-sm text-muted-foreground text-right truncate">
                                {noteItem?.timestamp || "Not Added"}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover">
                            <p className="text-popover-foreground text-xs">Click to copy</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualLeadPage;