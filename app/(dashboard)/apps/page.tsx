"use client";

import React from "react";
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
  Download
} from "lucide-react";

const AppsPage = () => {
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

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

  return (
    <div
      className={`grid align-center gap-4 md:rounded-none rounded-[4px] transition-all duration-500 ease-in-out px-2 py-6 w-auto 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden`}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Apps & Integrations</h1>
        <p className="text-muted-foreground">
          Extend your CRM functionality with these powerful apps and integrations
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-100">All</Badge>
        <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-100">Marketing</Badge>
        <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-100">Communication</Badge>
        <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-100">Productivity</Badge>
        <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-slate-100">Analytics</Badge>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Card key={app.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {app.icon}
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
                disabled={app.status !== "Available"}
              >
                Learn More
              </Button>
              <Button 
                size="sm"
                disabled={app.status !== "Available"}
                className="flex items-center gap-1"
              >
                {app.status === "Available" ? (
                  <>
                    <Download className="h-4 w-4" />
                    Install
                  </>
                ) : (
                  "Notify Me"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Third-party Integrations */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Third-Party Integrations</h2>
        <Card>
          <CardHeader>
            <CardTitle>Connect with other services</CardTitle>
            <CardDescription>
              Integrate your CRM with popular third-party services to enhance your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Google Workspace", "Microsoft 365", "Slack", "Zoom", "Zapier", "Mailchimp", "HubSpot", "Stripe"].map((integration, index) => (
                <div key={index} className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <ExternalLink className="h-6 w-6 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-center">{integration}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Integrations</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AppsPage;
