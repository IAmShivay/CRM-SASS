"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  LayoutGrid, 
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";

// Define platform integration type
type PlatformIntegration = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "active" | "beta" | "coming-soon";
  documentationUrl?: string;
  logoUrl?: string;
};

const PlatformIntegrations: React.FC = () => {
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  
  const {
    data: workspacesData,
    isLoading: workspaceLoading,
    error: workspaceError,
  } = useGetActiveWorkspaceQuery();

  // Mock data for platforms
  const [platforms, setPlatforms] = useState<PlatformIntegration[]>([
    {
      id: "1",
      name: "Salesforce",
      category: "CRM",
      description: "Integrate with Salesforce to synchronize leads and contacts.",
      status: "active",
      documentationUrl: "/docs/integrations/salesforce",
    },
    {
      id: "2",
      name: "HubSpot",
      category: "Marketing",
      description: "Connect with HubSpot to manage your marketing campaigns and leads.",
      status: "active",
      documentationUrl: "/docs/integrations/hubspot",
    },
    {
      id: "3",
      name: "Zapier",
      category: "Automation",
      description: "Use Zapier to connect with thousands of apps and automate your workflows.",
      status: "active",
      documentationUrl: "/docs/integrations/zapier",
    },
    {
      id: "4",
      name: "Mailchimp",
      category: "Email Marketing",
      description: "Sync your email lists and campaigns with Mailchimp.",
      status: "active",
      documentationUrl: "/docs/integrations/mailchimp",
    },
    {
      id: "5",
      name: "Slack",
      category: "Communication",
      description: "Get real-time notifications and updates in your Slack channels.",
      status: "active",
      documentationUrl: "/docs/integrations/slack",
    },
    {
      id: "6",
      name: "Google Analytics",
      category: "Analytics",
      description: "Track lead sources and conversion rates with Google Analytics.",
      status: "beta",
      documentationUrl: "/docs/integrations/google-analytics",
    },
    {
      id: "7",
      name: "Microsoft Dynamics",
      category: "CRM",
      description: "Synchronize lead data with Microsoft Dynamics CRM.",
      status: "coming-soon",
    },
    {
      id: "8",
      name: "Zoho CRM",
      category: "CRM",
      description: "Connect your leads and contacts with Zoho CRM.",
      status: "beta",
      documentationUrl: "/docs/integrations/zoho",
    }
  ]);
  
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlatforms, setFilteredPlatforms] = useState<PlatformIntegration[]>(platforms);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "beta" | "coming-soon">("all");

  // Toggle row expansion for mobile view
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Handle search and filtering
  useEffect(() => {
    let results = platforms;
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(platform => 
        platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== "all") {
      results = results.filter(platform => platform.status === activeFilter);
    }
    
    setFilteredPlatforms(results);
  }, [searchTerm, platforms, activeFilter]);

  // Status badge color mapping
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "beta":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "coming-soon":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  if (workspaceLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div
      className={`grid align-center gap-0 md:gap-2 md:rounded-none rounded-[4px] transition-all duration-500 ease-in-out px-2 py-6 w-auto 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden`}
    >
      <Card className="w-full rounded-[16px] md:rounded-[4px] overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
          <div className="flex gap-6">
            <div className="md:hidden lg:hidden w-2 h-2 pb-4 text-gray-700 dark:text-gray-300">
              <LayoutGrid />
            </div>
            <CardTitle className="text-sm md:text-xl lg:text-2xl text-gray-900 dark:text-white">
              Supported Integrations
            </CardTitle>
          </div>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search platforms..."
              className="pl-8 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <Button 
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={activeFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("active")}
          >
            Active
          </Button>
          <Button 
            variant={activeFilter === "beta" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("beta")}
          >
            Beta
          </Button>
          <Button 
            variant={activeFilter === "coming-soon" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("coming-soon")}
          >
            Coming Soon
          </Button>
        </div>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Platform</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Documentation</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="w-auto">
                {filteredPlatforms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No integrations found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlatforms.map((platform) => (
                    <React.Fragment key={platform.id}>
                      {/* Mobile View (Collapsed) */}
                      <TableRow
                        className="flex md:hidden lg:hidden items-center justify-between border-b border-gray-300 p-2 last:border-none"
                      >
                        <div className="flex flex-col gap-0 md:hidden">
                          <div className="text-[1rem]">{platform.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-gray-500">{platform.category}</div>
                            <Badge className={getStatusBadgeColor(platform.status)}>
                              {platform.status === "coming-soon" 
                                ? "Coming Soon" 
                                : platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleRow(platform.id)}
                            className="h-8 w-8 border-none bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md"
                          >
                            {expandedRow === platform.id ? (
                              <ChevronUp />
                            ) : (
                              <ChevronDown />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Mobile View (Expanded) */}
                      {expandedRow === platform.id && (
                        <TableRow className="md:hidden lg:hidden">
                          <TableCell colSpan={5}>
                            <div className="rounded-md">
                              <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                                {platform.description}
                              </p>
                              
                              {platform.documentationUrl && (
                                <div className="flex justify-end mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => window.open(platform.documentationUrl, "_blank")}
                                  >
                                    <span>Documentation</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Desktop View */}
                      <TableRow
                        key={`${platform.id}-desktop`}
                        className="hidden md:table-row"
                      >
                        <TableCell>{platform.name}</TableCell>
                        <TableCell>{platform.category}</TableCell>
                        <TableCell>{platform.description}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(platform.status)}>
                            {platform.status === "coming-soon" 
                              ? "Coming Soon" 
                              : platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {platform.documentationUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => window.open(platform.documentationUrl, "_blank")}
                            >
                              <span>View Docs</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-gray-500 text-sm">Coming soon</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformIntegrations;