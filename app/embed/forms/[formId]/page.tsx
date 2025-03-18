"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader } from "@/components/ui/loader";

// Create a Supabase client with the public URL and anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EmbeddedForm({ params }: { params: { formId: string } }) {
  const { formId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        
        // Fetch the form data
        const { data, error } = await supabase
          .from("custom_forms")
          .select("*")
          .eq("id", formId)
          .eq("is_active", true)
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (!data) {
          throw new Error("Form not found or inactive");
        }
        
        setForm(data);
      } catch (err: any) {
        console.error("Error fetching form:", err);
        setError(err.message || "Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    
    fetchForm();
  }, [formId]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      
      // Collect form data
      const formElement = event.currentTarget;
      const formData = new FormData(formElement);
      const data: Record<string, any> = {};
      
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      
      // Submit to the API
      const response = await fetch(`${window.location.origin}/api/forms/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId,
          data,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }
      
      // Show success message
      const successMessage = document.createElement("div");
      successMessage.className = "success-message";
      successMessage.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3 style="color: #4CAF50; margin-bottom: 10px;">Form Submitted Successfully!</h3>
          <p>Thank you for your submission. We'll be in touch soon.</p>
          <button id="reset-form" style="
            background-color: #4a6cf7;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          ">Submit Another Response</button>
        </div>
      `;
      
      // Replace form with success message
      const formContainer = document.getElementById("form-container");
      if (formContainer) {
        formContainer.innerHTML = "";
        formContainer.appendChild(successMessage);
        
        // Add event listener to reset button
        const resetButton = document.getElementById("reset-form");
        if (resetButton) {
          resetButton.addEventListener("click", () => {
            // Reload the page to reset the form
            window.location.reload();
          });
        }
      }
    } catch (err: any) {
      console.error("Error submitting form:", err);
      alert(err.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner"></div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#f44336" }}>
        <h3>Error Loading Form</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Default spinner styles */
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #4a6cf7;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Form custom styles */
        ${form?.css_content || ""}
      `}} />
      
      <div id="form-container">
        <div dangerouslySetInnerHTML={{ __html: form?.html_content || "" }} />
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        // Add form submission handling
        document.addEventListener('DOMContentLoaded', function() {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              // Show loading state
              const submitButton = form.querySelector('button[type="submit"]');
              if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
                
                // Add spinner to button
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                spinner.style.display = 'inline-block';
                spinner.style.width = '16px';
                spinner.style.height = '16px';
                spinner.style.marginRight = '8px';
                spinner.style.verticalAlign = 'middle';
                submitButton.prepend(spinner);
              }
              
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
                    formId: '${formId}',
                    data,
                  }),
                });
                
                if (response.ok) {
                  // Show success message
                  const successMessage = document.createElement('div');
                  successMessage.className = 'success-message';
                  successMessage.innerHTML = \`
                    <div style="text-align: center; padding: 20px;">
                      <h3 style="color: #4CAF50; margin-bottom: 10px;">Form Submitted Successfully!</h3>
                      <p>Thank you for your submission. We'll be in touch soon.</p>
                      <button id="reset-form" style="
                        background-color: #4a6cf7;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-top: 10px;
                      ">Submit Another Response</button>
                    </div>
                  \`;
                  
                  // Replace form with success message
                  const formContainer = document.getElementById('form-container');
                  if (formContainer) {
                    formContainer.innerHTML = '';
                    formContainer.appendChild(successMessage);
                    
                    // Add event listener to reset button
                    const resetButton = document.getElementById('reset-form');
                    if (resetButton) {
                      resetButton.addEventListener('click', () => {
                        // Reload the page to reset the form
                        window.location.reload();
                      });
                    }
                  }
                } else {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to submit form');
                }
              } catch (error) {
                console.error('Error submitting form:', error);
                alert(error.message || 'Failed to submit form. Please try again.');
                
                // Reset button state
                if (submitButton) {
                  submitButton.disabled = false;
                  submitButton.textContent = originalText;
                }
              }
            });
          });
        });
        
        // Custom JavaScript
        ${form?.js_content || ""}
      `}} />
    </>
  );
}
