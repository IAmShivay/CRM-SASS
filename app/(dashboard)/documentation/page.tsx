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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  FileText,
  Code,
  ChevronRight,
  Check,
  Users,
  BookOpen,
  RefreshCw,
  Settings,
  Webhook,
  Laptop,
  Smartphone,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

// Mock webhook data for examples
const exampleWebhooks = [
  {
    id: "1",
    name: "Website Contact Form",
    type: "Website",
    status: true,
    webhook_url: "https://example.com/leads?action=getLeads&sourceId=1&workspaceId=123",
    description: "Lead capture from the main website contact form"
  },
  {
    id: "2",
    name: "Facebook Campaign",
    type: "Social Media",
    status: true,
    webhook_url: "https://example.com/leads?action=getLeads&sourceId=2&workspaceId=123",
    description: "Lead generation from Facebook ad campaigns"
  }
];

const LeadSourceManagerDocs: React.FC = () => {
  // For sidebar collapse functionality - mimicking the original component
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

  const [copied, setCopied] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className={`transition-all duration-300 px-4 py-6 
      ${isCollapsed ? "lg:ml-[80px] md:ml-[80px]" : "lg:ml-[250px] md:ml-[250px]"} w-auto`}
    >
      <Card className="w-full rounded-[16px] md:rounded-[4px] overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
          <div className="flex gap-6">
            <div className="md:hidden lg:hidden w-2 h-2 pb-4 text-gray-700 dark:text-gray-300">
              <BookOpen />
            </div>
            <CardTitle className="text-sm md:text-xl lg:text-2xl text-gray-900 dark:text-white">
              Lead Source Manager Documentation
            </CardTitle>
          </div>
          <Button
            className="md:w-auto bg-primary dark:bg-primary-dark text-white dark:text-gray-700"
            onClick={() => window.open('https://github.com/yourusername/lead-source-manager', '_blank')}
          >
            <Code className="mr-2 h-3 w-3 text-md md:h-4 md:w-4 text-gray-700 dark:text-gray-700" />
            View Source
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start mb-6 overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="installation">Installation</TabsTrigger>
              <TabsTrigger value="usage">Usage Guide</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold mb-4">What is Lead Source Manager?</h2>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Lead Source Manager is a React component that enables you to create and manage webhook endpoints 
                  for lead generation. It provides a user-friendly interface to handle multiple lead sources, 
                  track their performance, and integrate with external platforms.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Users className="mr-2 h-5 w-5 text-primary" />
                        Lead Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create, edit, and delete lead sources with custom names, types, and descriptions.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Webhook className="mr-2 h-5 w-5 text-primary" />
                        Webhook Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generate unique webhook URLs that can be integrated with external platforms.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Settings className="mr-2 h-5 w-5 text-primary" />
                        Status Control
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable or disable sources with a toggle to control data flow.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Laptop className="mr-2 h-5 w-5 text-primary" />
                        <Smartphone className="mr-2 h-4 w-4 text-primary" />
                        Responsive Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Optimized for both desktop and mobile devices with adaptive layouts.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Installation Tab */}
            <TabsContent value="installation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Installation</CardTitle>
                  <CardDescription>
                    Follow these steps to install the Lead Source Manager component
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Prerequisites</h3>
                    <p className="mb-2">Make sure you have the following dependencies installed:</p>
                    
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("deps", `npm install @/components/ui lucide-react react-hook-form @hookform/resolvers zod uuid sonner`)}
                        >
                          {copied === "deps" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">npm install @/components/ui lucide-react react-hook-form @hookform/resolvers zod uuid sonner</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Component Import</h3>
                    <p className="mb-2">Import the component into your project:</p>
                    
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("import", `import LeadSourceManager from "@/components/LeadSourceManager";`)}
                        >
                          {copied === "import" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">import LeadSourceManager from &quot;@/components/LeadSourceManager&quot;;</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Component Usage</h3>
                    <p className="mb-2">Add the component to your page:</p>
                    
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("usage", `export default function LeadSourcesPage() {
  return (
    <div className="container mx-auto py-8">
      <LeadSourceManager />
    </div>
  );
}`)}
                        >
                          {copied === "usage" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">{`export default function LeadSourcesPage() {
  return (
    <div className="container mx-auto py-8">
      <LeadSourceManager />
    </div>
  );
}`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Usage Guide Tab */}
            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Guide</CardTitle>
                  <CardDescription>How to use the Lead Source Manager component</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="create">
                      <AccordionTrigger>Creating a New Lead Source</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Click the <strong>&quot;Add Source&quot;</strong> button in the top right corner of the card.</li>
                          <li>In the dialog that appears, fill in:
                            <ul className="list-disc list-inside ml-6 mt-1">
                              <li><strong>Source Name</strong>: A unique identifier for your lead source</li>
                              <li><strong>Source Type</strong>: The category or platform (e.g., &quot;Website&quot;, &quot;Facebook&quot;)</li>
                              <li><strong>Description</strong> (optional): Additional information about this source</li>
                            </ul>
                          </li>
                          <li>Click <strong>&quot;Add Source&quot;</strong> to create the webhook.</li>
                          <li>A unique webhook URL will be automatically generated.</li>
                        </ol>
                        
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <p className="text-sm font-medium mb-2">💡 Tip</p>
                          <p className="text-sm">Use descriptive names and types to easily identify your lead sources later.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="manage">
                      <AccordionTrigger>Managing Lead Sources</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <h4 className="text-md font-medium">Copying Webhook URLs</h4>
                        <p>Click the <strong>Copy</strong> icon next to any webhook URL to copy it to your clipboard.</p>
                        
                        <h4 className="text-md font-medium">Enabling/Disabling Sources</h4>
                        <p>Toggle the <strong>Switch</strong> in the Status column to enable or disable a lead source.</p>
                        
                        <h4 className="text-md font-medium">Editing a Source</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Click the <strong>Pencil</strong> icon in the Actions column.</li>
                          <li>Modify the source details as needed.</li>
                          <li>Click <strong>&quot;Update Source&quot;</strong> to save changes.</li>
                        </ol>
                        
                        <h4 className="text-md font-medium">Deleting a Source</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Click the <strong>Trash</strong> icon in the Actions column.</li>
                          <li>Confirm deletion in the dialog that appears.</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="mobile">
                      <AccordionTrigger>Mobile Experience</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-3">On mobile devices, the Lead Source Manager displays a simplified view:</p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Sources are displayed in a compact list showing only name and type</li>
                          <li>Tap the dropdown icon to expand and view all details for a specific source</li>
                          <li>All actions (copy, edit, delete) are available in the expanded view</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Example Lead Sources Table</CardTitle>
                  <CardDescription>How the component displays lead sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Webhook</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exampleWebhooks.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium">{source.name}</TableCell>
                            <TableCell>{source.type}</TableCell>
                            <TableCell>{source.description}</TableCell>
                            <TableCell className="max-w-xs truncate">{source.webhook_url}</TableCell>
                            <TableCell>
                              <span className={source.status ? "text-green-600" : "text-red-600"}>
                                {source.status ? "Enabled" : "Disabled"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Integration Tab */}
            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integration with External Platforms</CardTitle>
                  <CardDescription>How to use lead source webhooks with other systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Webhook Structure</h3>
                    <p className="mb-2">The generated webhook URL follows this format:</p>
                    
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("webhook-url", `{BASE_URL}/leads?action=getLeads&sourceId={SOURCE_ID}&workspaceId={WORKSPACE_ID}`)}
                        >
                          {copied === "webhook-url" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">{`{BASE_URL}/leads?action=getLeads&sourceId={SOURCE_ID}&workspaceId={WORKSPACE_ID}`}</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sending Data to Webhooks</h3>
                    <p className="mb-2">To send leads to your webhook, make a POST request with this JSON structure:</p>
                    
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("webhook-payload", `{
  "lead": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Inc.",
    "message": "Interested in your services",
    "additionalFields": {
      "custom1": "value1",
      "custom2": "value2"
    }
  }
}`)}
                        >
                          {copied === "webhook-payload" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">{`{
  "lead": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Inc.",
    "message": "Interested in your services",
    "additionalFields": {
      "custom1": "value1",
      "custom2": "value2"
    }
  }
}`}</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Supported Integration Platforms</h3>
                    <p className="mb-2">The Lead Source Manager works seamlessly with:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Form Builders</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Typeform</li>
                            <li>JotForm</li>
                            <li>Google Forms</li>
                            <li>Wufoo</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">CRM Systems</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Salesforce</li>
                            <li>HubSpot</li>
                            <li>Zoho CRM</li>
                            <li>Pipedrive</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Marketing Platforms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Facebook Lead Ads</li>
                            <li>LinkedIn Lead Gen Forms</li>
                            <li>Twitter Lead Generation Cards</li>
                            <li>Google Ads</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Automation Tools</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Zapier</li>
                            <li>Make (Integromat)</li>
                            <li>n8n</li>
                            <li>IFTTT</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* API Reference Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Reference</CardTitle>
                  <CardDescription>Backend API endpoints used by the Lead Source Manager</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><code>/api/webhooks</code></TableCell>
                        <TableCell>GET</TableCell>
                        <TableCell>Retrieve all webhooks for a workspace</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/api/webhooks</code></TableCell>
                        <TableCell>POST</TableCell>
                        <TableCell>Create a new webhook</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/api/webhooks/{"{id}"}</code></TableCell>
                        <TableCell>PUT</TableCell>
                        <TableCell>Update an existing webhook</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/api/webhooks/{"{id}"}</code></TableCell>
                        <TableCell>DELETE</TableCell>
                        <TableCell>Delete a webhook</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><code>/api/webhooks/{"{id}"}/status</code></TableCell>
                        <TableCell>PATCH</TableCell>
                        <TableCell>Toggle webhook status</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Component Props</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prop</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell><code>onSourceCreated</code></TableCell>
                          <TableCell><code>(source: Source) =&gt; void</code></TableCell>
                          <TableCell><code>undefined</code></TableCell>
                          <TableCell>Callback function when a new source is created</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>onSourceUpdated</code></TableCell>
                          <TableCell><code>(source: Source) =&gt; void</code></TableCell>
                          <TableCell><code>undefined</code></TableCell>
                          <TableCell>Callback function when a source is updated</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>onSourceDeleted</code></TableCell>
                          <TableCell><code>(id: string) =&gt; void</code></TableCell>
                          <TableCell><code>undefined</code></TableCell>
                          <TableCell>Callback function when a source is deleted</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>initialSources</code></TableCell>
                          <TableCell><code>Source[]</code></TableCell>
                          <TableCell><code>[]</code></TableCell>
                          <TableCell>Initial sources to display</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Source Type Definition</h3>
                    <div className="relative mt-2 rounded-md bg-slate-950 p-4">
                      <div className="absolute right-4 top-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-slate-100"
                          onClick={() => copyToClipboard("type-def", `export type Source = {
  webhook?: string; // URL as a string
  created_at?: string; // ISO 8601 formatted date string
  description?: string; // String, can be empty
  id: string; // UUID
  name: string; // Name of the source
  status: boolean; // True or false, indicates the status
  type: string; // Type of the source (e.g., 'website')
  user_id?: string; // User UUID associated with the source
  webhook_url?: string; // URL as a string
  workspace_id?: string | null; // Can be a string or null
};`)}
                        >
                          {copied === "type-def" ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-sm text-slate-100">
                        <code className="font-mono">{`export type Source = {
  webhook?: string; // URL as a string
  created_at?: string; // ISO 8601 formatted date string
  description?: string; // String, can be empty
  id: string; // UUID
  name: string; // Name of the source
  status: boolean; // True or false, indicates the status
  type: string; // Type of the source (e.g., 'website')
  user_id?: string; // User UUID associated with the source
  webhook_url?: string; // URL as a string
  workspace_id?: string | null; // Can be a string or null
};`}</code>
                      </pre>
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

export default LeadSourceManagerDocs;