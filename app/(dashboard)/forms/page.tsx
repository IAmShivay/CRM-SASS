"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";
import { useGetWebhooksQuery } from "@/lib/store/services/webhooks";
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
import { Switch } from "@/components/ui/switch";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Save, Share, Trash, Plus, Code, Eye } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Form schema for validation
const formSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  description: z.string().optional(),
  html_content: z.string().min(1, "HTML content is required"),
  css_content: z.string().optional(),
  js_content: z.string().optional(),
  is_active: z.boolean().default(true),
  lead_source_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Create a Supabase client for realtime updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FormsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams ? searchParams.get("id") : null;
  const isCollapsed = useSelector((state: RootState) => state.sidebar.isCollapsed);
  const { data: activeWorkspace, isLoading: isWorkspaceLoading } = useGetActiveWorkspaceQuery();
  const workspaceId = activeWorkspace?.data?.id;
  const { data: webhooksData, isLoading: isWebhooksLoading } = useGetWebhooksQuery({ id: workspaceId || '' }, { skip: !workspaceId });

  const [forms, setForms] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forms");
  const [editorTab, setEditorTab] = useState("html");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form hook
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      html_content: getDefaultHtml(),
      css_content: getDefaultCss(),
      js_content: getDefaultJs(),
      is_active: true,
      lead_source_id: "",
    },
  });

  // Effects for fetching data
  useEffect(() => {
    if (workspaceId) {
      fetchForms();

      // Set up realtime subscription for leads
      const channel = supabase
        .channel('public:leads')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspaceId}`
        }, (payload) => {
          toast.success('New lead received!', {
            description: `${payload.new.name} from ${payload.new.company || 'Unknown'}`,
          });
          // You could invalidate the leads query here if needed
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [workspaceId]);

  // Set lead sources from webhooks data when it's available
  useEffect(() => {
    if (webhooksData?.webhooks) {
      setLeadSources(webhooksData.webhooks);
      setLoading(false);
    }
  }, [webhooksData]);

  // Fetch form details if editing an existing form
  useEffect(() => {
    if (formId && workspaceId) {
      fetchFormDetails(formId);
    }
  }, [formId, workspaceId]);

  // Fetch all forms for the current workspace
  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms?workspace_id=${workspaceId}`);
      // http://localhost:3000/api/=3

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  // Fetch details of a specific form
  const fetchFormDetails = async (id: string) => {
    try {
      setFormLoading(true);
      const response = await fetch(`/api/forms/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form details');
      }
      const data = await response.json();

      // Reset form with fetched data
      form.reset({
        name: data.form.name,
        description: data.form.description || "",
        html_content: data.form.html_content,
        css_content: data.form.css_content || "",
        js_content: data.form.js_content || "",
        is_active: data.form.is_active,
        lead_source_id: data.form.lead_source_id || "",
      });

      setActiveTab("editor");
    } catch (error) {
      console.error('Error fetching form details:', error);
      toast.error('Failed to load form details');
    } finally {
      setFormLoading(false);
    }
  };
  console.log(webhooksData);
  // Create or update a form
  const onSubmit = async (values: FormValues) => {
    try {
      setFormLoading(true);

      // Add workspace_id to the form data and handle "none" lead_source_id
      const formData = {
        ...values,
        workspace_id: Number(workspaceId), // Convert to number
        lead_source_id: values.lead_source_id === "none" ? null : values.lead_source_id,
      };

      let response;
      if (formId) {
        // Update existing form
        response = await fetch(`/api/forms?id=${formId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new form
        response = await fetch('/api/forms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      const data = await response.json();
      toast.success(formId ? 'Form updated successfully' : 'Form created successfully');

      // Redirect to the form editor with the new form ID
      if (!formId) {
        router.push(`/forms?id=${data.form.id}`);
      }

      // Refresh the forms list
      fetchForms();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete a form
  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/forms?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete form');
      }

      toast.success('Form deleted successfully');

      // If currently editing this form, redirect to forms list
      if (formId === id) {
        router.push('/forms');
      }

      // Refresh the forms list
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    } finally {
      setLoading(false);
    }
  };

  // Generate preview URL for the form
  const generatePreview = () => {
    const formValues = form.getValues();
    const htmlContent = formValues.html_content;
    const cssContent = formValues.css_content || '';
    const jsContent = formValues.js_content || '';

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formValues.name}</title>
        <style>${cssContent}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          // Form submission handler
          document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
              form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Collect form data
                const formData = new FormData(form);
                const data = {};
                for (const [key, value] of formData.entries()) {
                  data[key] = value;
                }
                
                // Submit to the API
                try {
                  const response = await fetch('${window.location.origin}/api/forms/submit', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      formId: '${formId || "preview"}',
                      data,
                    }),
                  });
                  
                  if (response.ok) {
                    alert('Form submitted successfully!');
                    form.reset();
                  } else {
                    alert('Failed to submit form. Please try again.');
                  }
                } catch (error) {
                  console.error('Error submitting form:', error);
                  alert('An error occurred. Please try again later.');
                }
              });
            });
          });
          
          ${jsContent}
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    // Open the preview in a new tab
    window.open(url, '_blank');
  };

  // Copy the form embed code
  const copyEmbedCode = () => {
    if (!formId) {
      toast.error('Please save the form first');
      return;
    }

    const embedCode = `<iframe src="${window.location.origin}/embed/forms/${formId}" width="100%" height="500" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  // Create a new form
  const createNewForm = () => {
    form.reset({
      name: "",
      description: "",
      html_content: getDefaultHtml(),
      css_content: getDefaultCss(),
      js_content: getDefaultJs(),
      is_active: true,
      lead_source_id: "none",
    });

    router.push('/forms');
    setActiveTab("editor");
  };

  // Default HTML template
  function getDefaultHtml() {
    return `<form class="contact-form">
  <h2>Contact Us</h2>
  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div class="form-group">
    <label for="phone">Phone</label>
    <input type="tel" id="phone" name="phone">
  </div>
  <div class="form-group">
    <label for="company">Company</label>
    <input type="text" id="company" name="company">
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message" name="message" rows="4"></textarea>
  </div>
  <button type="submit">Submit</button>
</form>`;
  }

  // Default CSS template
  function getDefaultCss() {
    return `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

body {
  background-color: #f8f9fa;
  padding: 20px;
}

.contact-form {
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

textarea {
  resize: vertical;
}

button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3a5ad9;
}`;
  }

  // Default JavaScript template
  function getDefaultJs() {
    return `// Add custom JavaScript here
// This will be executed after the form submission handler

// Example: Form validation
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.contact-form');
  const emailInput = document.querySelector('#email');
  
  emailInput.addEventListener('blur', function() {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(emailInput.value) && emailInput.value !== '') {
      emailInput.style.borderColor = 'red';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Please enter a valid email address';
      errorMsg.style.color = 'red';
      errorMsg.style.fontSize = '12px';
      errorMsg.style.marginTop = '5px';
      
      // Remove any existing error message
      const existingError = emailInput.parentNode.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      emailInput.parentNode.appendChild(errorMsg);
    } else {
      emailInput.style.borderColor = '#ddd';
      const existingError = emailInput.parentNode.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
    }
  });
});`;
  }

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please select a workspace to continue</p>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 transition-all duration-300 ease-in-out 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      max-w-8xl mx-auto`}>
      <Card className="w-full rounded-[16px] md:rounded-[4px] overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
          <CardTitle className="text-sm md:text-xl lg:text-2xl gradient-heading">
            Form Builder
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="accent" onClick={createNewForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-6 overflow-x-auto">
              <TabsTrigger value="forms">My Forms</TabsTrigger>
              <TabsTrigger value="editor">Form Editor</TabsTrigger>
              {formId && <TabsTrigger value="preview">Preview</TabsTrigger>}
            </TabsList>

            {/* Forms List Tab */}
            <TabsContent value="forms" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader size="lg" variant="primary" />
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-4">No forms created yet</p>
                  <Button variant="accent" onClick={createNewForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Form
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forms.map((form) => (
                    <Card key={form.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <CardDescription>
                          {form.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-sm mr-2">Status:</span>
                            <span className={`text-sm font-medium ${form.is_active ? "text-green-500" : "text-red-500"}`}>
                              {form.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(form.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                      <div className="flex justify-between p-4 pt-0">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/forms?id=${form.id}`)}>
                          Edit
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => copyEmbedCode()}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)}>
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Form Editor Tab */}
            <TabsContent value="editor" className="space-y-6">
              {formLoading ? (
                <div className="flex justify-center py-10">
                  <Loader size="lg" variant="primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Form Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact Form" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="A brief description of this form's purpose"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lead_source_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lead Source</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a lead source" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {webhooksData?.data?.map((source: any) => (
                                    <SelectItem key={source.id} value={source.id}>
                                      {source.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Connect this form to a lead source to track submissions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Active
                                </FormLabel>
                                <FormDescription>
                                  When active, this form can receive submissions
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="border rounded-md overflow-hidden">
                          <Tabs value={editorTab} onValueChange={setEditorTab} className="w-full">
                            <div className="bg-muted p-2 border-b">
                              <TabsList className="w-full">
                                <TabsTrigger value="html" className="flex items-center">
                                  <Code className="mr-2 h-4 w-4" />
                                  HTML
                                </TabsTrigger>
                                <TabsTrigger value="css" className="flex items-center">
                                  <Code className="mr-2 h-4 w-4" />
                                  CSS
                                </TabsTrigger>
                                <TabsTrigger value="js" className="flex items-center">
                                  <Code className="mr-2 h-4 w-4" />
                                  JavaScript
                                </TabsTrigger>
                              </TabsList>
                            </div>

                            <TabsContent value="html" className="mt-0 border-0 p-0">
                              <FormField
                                control={form.control}
                                name="html_content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        className="font-mono min-h-[400px] rounded-none border-0 resize-none focus-visible:ring-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>

                            <TabsContent value="css" className="mt-0 border-0 p-0">
                              <FormField
                                control={form.control}
                                name="css_content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        className="font-mono min-h-[400px] rounded-none border-0 resize-none focus-visible:ring-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>

                            <TabsContent value="js" className="mt-0 border-0 p-0">
                              <FormField
                                control={form.control}
                                name="js_content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        className="font-mono min-h-[400px] rounded-none border-0 resize-none focus-visible:ring-0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("forms")}>
                        Cancel
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={generatePreview}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button type="submit" variant="accent">
                          <Save className="mr-2 h-4 w-4" />
                          Save Form
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              )}
            </TabsContent>

            {/* Preview Tab */}
            {formId && (
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Preview</CardTitle>
                    <CardDescription>
                      This is how your form will appear to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <Button variant="outline" onClick={generatePreview}>
                        <Eye className="mr-2 h-4 w-4" />
                        Open Preview in New Tab
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      {previewUrl ? (
                        <iframe
                          src={previewUrl}
                          className="w-full h-[600px]"
                          title="Form Preview"
                        />
                      ) : (
                        <div className="flex justify-center items-center h-[600px] bg-muted">
                          <Button variant="outline" onClick={generatePreview}>
                            Generate Preview
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Embed Code</CardTitle>
                    <CardDescription>
                      Use this code to embed your form on any website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                      {`<iframe src="${window.location.origin}/embed/forms/${formId}" width="100%" height="500" frameborder="0"></iframe>`}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" onClick={copyEmbedCode}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Embed Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormsPage;
