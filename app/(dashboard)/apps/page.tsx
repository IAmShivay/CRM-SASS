"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import {
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  BarChart2,
  Users,
  Phone,
  Globe,
  ExternalLink,
  Search,
  Filter,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";

const AppsPage = () => {
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

  // State for filtering
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Sample apps data
  const apps = [
    {
      id: 1,
      name: "Email Marketing",
      description: "Send targeted email campaigns to your leads and contacts",
      icon: <Mail className="h-10 w-10 text-blue-500" />,
      status: "Available",
      category: "Marketing"
    },
    {
      id: 2,
      name: "Meeting Scheduler",
      description: "Allow leads to book meetings directly into your calendar",
      icon: <Calendar className="h-10 w-10 text-green-500" />,
      status: "Available",
      category: "Productivity"
    },
    {
      id: 3,
      name: "Live Chat",
      description: "Engage with website visitors in real-time",
      icon: <MessageSquare className="h-10 w-10 text-purple-500" />,
      status: "Available",
      category: "Communication"
    },
    {
      id: 4,
      name: "Document Management",
      description: "Store and manage documents related to your leads and deals",
      icon: <FileText className="h-10 w-10 text-yellow-500" />,
      status: "Coming Soon",
      category: "Productivity"
    },
    {
      id: 5,
      name: "Advanced Analytics",
      description: "Get deeper insights into your sales and marketing performance",
      icon: <BarChart2 className="h-10 w-10 text-red-500" />,
      status: "Coming Soon",
      category: "Analytics"
    },
    {
      id: 6,
      name: "Team Collaboration",
      description: "Tools for better team coordination and communication",
      icon: <Users className="h-10 w-10 text-indigo-500" />,
      status: "Coming Soon",
      category: "Communication"
    },
    {
      id: 7,
      name: "VoIP Calling",
      description: "Make calls directly from the CRM",
      icon: <Phone className="h-10 w-10 text-cyan-500" />,
      status: "Coming Soon",
      category: "Communication"
    },
    {
      id: 8,
      name: "Website Builder",
      description: "Create landing pages and forms for lead generation",
      icon: <Globe className="h-10 w-10 text-teal-500" />,
      status: "Coming Soon",
      category: "Marketing"
    }
  ];

  // Categories for filter
  const categories = ["All", "Marketing", "Communication", "Productivity", "Analytics"];

  // Filter apps based on category and search query
  const filteredApps = apps.filter(app => 
    (selectedCategory === "All" || app.category === selectedCategory) &&
    (app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className={`transition-all duration-500 ease-in-out md:px-6 md:py-8 py-4 px-3 ${
        isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"
      } w-auto overflow-hidden`}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Apps & Integrations</h1>
        <p className="text-muted-foreground">
          Extend your CRM functionality with these powerful apps and integrations
        </p>
      </div>

      {/* Search and Filter */}
      <div className="my-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search apps..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"} 
              className={`px-3 py-1 cursor-pointer ${
                selectedCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-slate-100"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <Card key={app.id} className="overflow-hidden transition-all hover:shadow-md group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                      {app.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription className="text-xs">{app.category}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={app.status === "Available" ? "default" : "secondary"}
                    className={app.status === "Available" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                  >
                    {app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{app.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 w-full"
                  disabled={app.status !== "Available"}
                >
                  <Info className="h-4 w-4" />
                  {app.status === "Available" ? "Learn More" : "Coming Soon"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No apps found matching your criteria</p>
          <Button variant="outline" className="mt-4" onClick={() => {setSelectedCategory("All"); setSearchQuery("")}}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Third-party Integrations */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Third-Party Integrations</h2>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Connect with other services</CardTitle>
            <CardDescription>
              Integrate your CRM with popular third-party services to enhance your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Google Workspace", "Microsoft 365", "Slack", "Zoom", "Zapier", "Mailchimp", "HubSpot", "Stripe"].map((integration, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <ExternalLink className="h-6 w-6 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-center">{integration}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Browse All Integrations</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AppsPage;