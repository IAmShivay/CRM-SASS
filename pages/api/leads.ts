// import { NextApiRequest, NextApiResponse } from "next";
// import { supabase } from "../../lib/supabaseServer";
// import Together from "together-ai";
// import axios from "axios";
// import cors from "cors";
// import { runMiddleware } from "@/utils/runMiddleware";
// // Initialize Together AI client
// const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });
// const SYSTEM_PROMPT = `You are a JSON formatter. Format the input data into a JSON object. ONLY OUTPUT THE JSON OBJECT, NO OTHER TEXT.

// Format Rules:
// 1. Extract name parts to first_name and last_name
// 2. Clean phone to digits and + only
// 3. Email to lowercase
// 4. Unknown fields go to custom_data and all unknown fields remove any underscore presenting characters from custom data 
// 5. Output format:
// {
//   "name": "",
//   "email": "",
//   "phone": "",
//   "message": "",
//   "custom_data": {}
// }
// If you see a full name, split it into first_name and last_name.
// If you see a phone number, clean it to only include digits and +.
// Move any unrecognized fields into custom_data.;
// in this add to format custom data as well by sortning key and values`;
// // Normalize any input data to a string
// const normalizeInput = (data: any): string => {
//   if (data === null || data === undefined) {
//     return "";
//   }

//   try {
//     if (typeof data === "string") {
//       return data;
//     }
//     return JSON.stringify(data);
//   } catch (e) {
//     return String(data);
//   }
// };

// // Basic validation of lead data
// const isValidLead = (data: any): boolean => {
//   if (!data) return false;

//   // Check if we have at least a name or phone
//   const hasName =
//     data.first_name || (data.custom_data && data.custom_data.name);
//   const hasPhone = data.phone || (data.custom_data && data.custom_data.phone);

//   return Boolean(hasName || hasPhone);
// };

// export async function validateEmail(email: string): Promise<boolean> {
//   try {
//     const response = await axios.get(
//       `https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=XL7ZTf8wKJLCBtE1pCLMvPr53zfHPRIw&mode=quick`
//     );

//     return (
//       response.data.is_valid_syntax &&
//       response.data.mx_accepts_mail &&
//       response.data.status === "valid"
//     );
//   } catch (error) {
//     console.error("Email validation error:", error);
//     return false;
//   }
// }

// // Phone number validation function
// export async function validatePhoneNumber(
//   phoneNumber: string
// ): Promise<boolean> {
//   try {
//     const response = await axios.get(
//       `https://api-bdc.net/data/phone-number-validate?number=${phoneNumber}&countryCode=IN&localityLanguage=en&key=bdc_a38fe464805a4a87a7da7dc81ff059cd`
//     );

//     // Check if phone number is valid based on API response
//     return response.data.isValid;
//   } catch (error) {
//     console.error("Phone number validation error:", error);
//     return false;
//   }
// }

// // Process data with Together AI with retry logic
// async function processWithAI(inputData: any) {
//   const MAX_RETRIES = 3;
//   let attempt = 0;
//   let lastError: any;

//   while (attempt < MAX_RETRIES) {
//     try {
//       const normalizedInput = normalizeInput(inputData);
//       let formattedResponse = "";

//       const response = await together.chat.completions.create({
//         messages: [
//           {
//             role: "system",
//             content: SYSTEM_PROMPT,
//           },
//           {
//             role: "user",
//             content: normalizedInput,
//           },
//         ],
//         model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
//         temperature: 0,
//         top_p: 1,
//         top_k: 1,
//         max_tokens: 500,
//         stream: true,
//       });

//       for await (const token of response) {
//         if (token.choices[0]?.delta?.content) {
//           formattedResponse += token.choices[0].delta.content;
//         }
//       }

//       // Find the JSON object in the response
//       const match = formattedResponse.match(/\{[\s\S]*\}/);
//       if (!match) {
//         throw new Error("No JSON found in AI response");
//       }

//       return JSON.parse(match[0]);
//     } catch (error) {
//       lastError = error;
//       console.error(`AI processing attempt ${attempt + 1} failed:`, error);
//       attempt++;
      
//       // If we've exhausted all retries, use fallback processing
//       if (attempt === MAX_RETRIES) {
//         console.log("AI processing failed after all retries, using fallback processing");
//         return createFallbackData(inputData);
//       }
      
//       // Wait for a short time before retrying (exponential backoff)
//       await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
//     }
//   }

//   throw lastError;
// }

// // Create fallback data with all fields in custom_data
// function createFallbackData(data: any) {
//   const staticFields = {
//     name: "Failed to process",
//     email: "",
//     phone: "",
//     message: "",
//     custom_data: {}
//   };

//   try {
//     const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
//     // First, store all data in custom_data
//     const custom_data: Record<string, any> = {};
    
//     // If it's an object, process all its fields
//     if (typeof inputData === "object" && !Array.isArray(inputData)) {
//       Object.entries(inputData).forEach(([key, value]) => {
//         const cleanKey = key.replace(/[_\s]/g, "").toLowerCase();
//         custom_data[cleanKey] = value;
//       });
//     }
//     // If it's an array (form fields), process each field
//     else if (Array.isArray(inputData)) {
//       inputData.forEach((field) => {
//         if (field.name && field.value) {
//           const cleanKey = field.name.replace(/[_\s]/g, "").toLowerCase();
//           custom_data[cleanKey] = field.value;
//         }
//       });
//     }

//     // Try to extract standard fields if possible
//     if (custom_data.email) {
//       staticFields.email = String(custom_data.email).toLowerCase();
//     }
//     if (custom_data.phone) {
//       staticFields.phone = String(custom_data.phone).replace(/[^\d+]/g, "");
//     }
//     if (custom_data.name) {
//       staticFields.name = String(custom_data.name);
//     }
//     if (custom_data.message) {
//       staticFields.message = String(custom_data.message);
//     }

//     return {
//       ...staticFields,
//       custom_data
//     };
//   } catch (error) {
//     console.error("Fallback processing error:", error);
//     // Return basic structure with all data in custom_data
//     return {
//       ...staticFields,
//       custom_data: { raw_data: data }
//     };
//   }
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const corsHandler = cors({
//     origin: "*", // Allow all origins (use specific origins in production)
//     methods: ["POST", "OPTIONS"], // Allowed methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   });
//   await runMiddleware(req, res, corsHandler);

//   const { method, body, query, headers } = req;
//   const action = query.action as string;
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }
//   try {
//     const sourceWebhook = `${
//       process.env.NEXT_PUBLIC_BASE_URL
//     }/leads?action=${"getLeads"}&sourceId=${req.query.sourceId}&workspaceId=${
//       req.query.workspaceId
//     }`;
//     const data = req.body;
//     const customData = req.body.custom_data;
//     if (!data) {
//       return res.status(400).json({ error: "No data provided" });
//     }

//     // Try AI processing first, fall back to manual if it fails
//     let processedData;
//     try {
//       processedData = await processWithAI(data);
//     } catch (error) {
//       console.log("AI processing failed, using fallback");
//       processedData = createFallbackData(data);
//     }

//     if (customData) {
//       processedData.custom_data = {
//         ...processedData.custom_data,
//         ...customData,
//       };
//     }

//     // Validate the processed data
//     if (!isValidLead(processedData)) {
//       return res.status(400).json({
//         error: "Invalid lead data",
//         details: "Name or phone number is required",
//         data: processedData,
//       });
//     }
//     const { data: webhookMatch, error: webhookError } = await supabase
//       .from("webhooks")
//       .select("user_id,status")
//       .eq("webhook_url", sourceWebhook)
//       .single(); // `single()` ensures a single record is returned
//     if (webhookError) {
//       console.error("Error fetching webhook:", webhookError.message);
//       throw new Error("Failed to fetch webhook details.");
//     }
//     if (!webhookMatch || webhookMatch.status !== true) {
//       console.error("Webhook deactivated or not found.");
//       throw new Error("Webhook deactivated.");
//     }

//     const isEmailValid = await validateEmail(processedData.email);
//     const isPhoneValid = await validatePhoneNumber(processedData.phone);
//     console.log(isEmailValid, isPhoneValid);
//     // Add metadata
//     const leadData = {
//       ...processedData,
//       created_at: new Date().toISOString(),
//       source: req.headers["origin"] || "unknown",
//       lead_source_id: req.query.sourceId,
//       user_id: webhookMatch?.user_id,
//       contact_method: "Call",
//       status: {
//         name: "Arrived",
//         color: "#FFA500",
//       },
//       work_id: req.query.workspaceId,
//       revenue: 0,
//       is_email_valid: isEmailValid || false,
//       is_phone_valid: isPhoneValid || false,
//     };

//     // Save to database
//     const { data: savedData, error: dbError } = await supabase
//       .from("leads")
//       .insert([leadData])
//       .select();

//     if (dbError) throw dbError;

//     return res.status(200).json({
//       message: "Lead successfully saved",
//       lead: savedData[0],
//     });
//   } catch (error: any) {
//     console.error("Error processing lead:", error);
//     return res.status(500).json({
//       error: "Failed to process lead",
//       details: error.message,
//     });
//   }
// }


import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseServer";
import Together from "together-ai";
import axios from "axios";
import cors from "cors";
import { runMiddleware } from "@/utils/runMiddleware";

// Initialize Together AI client
const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

// Smaller, more focused system prompt
const SYSTEM_PROMPT = `Format the input data into a JSON object. ONLY OUTPUT THE JSON OBJECT, NO OTHER TEXT.

Format Rules:
1. Extract name parts to first_name and last_name
2. Clean phone to digits and + only
3. Email to lowercase
4. Unknown fields go to custom_data with underscore characters removed
5. Output format:
{
  "name": "",
  "email": "",
  "phone": "",
  "message": "",
  "custom_data": {}
}`;

// Common field mappings for standard inputs
const FIELD_MAPPINGS: Record<string, string> = {
  // Name variations
  'firstname': 'first_name',
  'first_name': 'first_name',
  'fname': 'first_name',
  'lastName': 'last_name',
  'last_name': 'last_name',
  'lname': 'last_name',
  'fullname': 'name',
  'full_name': 'name',
  'name': 'name',
  
  // Contact variations
  'email': 'email',
  'emailAddress': 'email',
  'email_address': 'email',
  'mail': 'email',
  
  'phone': 'phone',
  'phoneNumber': 'phone',
  'phone_number': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'contactNumber': 'phone',
  
  // Message variations
  'message': 'message',
  'msg': 'message',
  'comment': 'message',
  'comments': 'message',
  'notes': 'message',
  'description': 'message',
};

// Normalize any input data to a string
const normalizeInput = (data: any): string => {
  if (data === null || data === undefined) {
    return "";
  }

  try {
    if (typeof data === "string") {
      return data;
    }
    return JSON.stringify(data);
  } catch (e) {
    return String(data);
  }
};

// Basic validation of lead data
const isValidLead = (data: any): boolean => {
  if (!data) return false;

  // Check if we have at least a name or phone
  const hasName = data.name || data.first_name || 
    (data.custom_data && (data.custom_data.name || data.custom_data.first_name));
  const hasPhone = data.phone || 
    (data.custom_data && data.custom_data.phone);
  const hasEmail = data.email || 
    (data.custom_data && data.custom_data.email);

  return Boolean(hasName || hasPhone || hasEmail);
};

// Email validation

export async function validateEmail(email: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=XL7ZTf8wKJLCBtE1pCLMvPr53zfHPRIw&mode=quick`
    );

    return (
      response.data.is_valid_syntax &&
      response.data.mx_accepts_mail &&
      response.data.status === "valid"
    );
  } catch (error) {
    console.error("Email validation error:", error);
    return false;
  }
}

// Phone number validation function
export async function validatePhoneNumber(
  phoneNumber: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://api-bdc.net/data/phone-number-validate?number=${phoneNumber}&countryCode=IN&localityLanguage=en&key=bdc_a38fe464805a4a87a7da7dc81ff059cd`
    );

    // Check if phone number is valid based on API response
    return response.data.isValid;
  } catch (error) {
    console.error("Phone number validation error:", error);
    return false;
  }
}

// Try to process structured data without AI
function processStructuredData(data: any): Record<string, any> | null {
  try {
    // Standard output format
    const result: Record<string, any> = {
      name: "",
      email: "",
      phone: "",
      message: "",
      custom_data: {}
    };
    
    // Convert to object if it's a string
    const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
    // Process based on data type
    if (typeof inputData === "object") {
      if (Array.isArray(inputData)) {
        // Handle form field array format: [{name: "field1", value: "value1"}, ...]
        for (const field of inputData) {
          if (field.name && field.value !== undefined) {
            const normalizedKey = field.name.toLowerCase().replace(/[_\s]/g, "");
            const mappedKey = FIELD_MAPPINGS[normalizedKey] || normalizedKey;
            
            // Use mapped key or put in custom_data
            if (result.hasOwnProperty(mappedKey)) {
              result[mappedKey as keyof typeof result] = field.value;
            } else {
              result.custom_data[normalizedKey] = field.value;
            }
          }
        }
      } else {
        // Handle object format: {field1: "value1", field2: "value2", ...}
        for (const [key, value] of Object.entries(inputData)) {
          const normalizedKey = key.toLowerCase().replace(/[_\s]/g, "");
          const mappedKey = FIELD_MAPPINGS[normalizedKey] || normalizedKey;
          
          // Handle special cases
          if (normalizedKey === "firstname" && inputData.lastname) {
            result.name = `${inputData.firstname} ${inputData.lastname}`;
          } 
          else if (normalizedKey === "fname" && inputData.lname) {
            result.name = `${inputData.fname} ${inputData.lname}`;
          }
          // Use mapped key or put in custom_data
          else if (result.hasOwnProperty(mappedKey)) {
            result[mappedKey] = String(value);
          } else {
            result.custom_data[normalizedKey] = value;
          }
        }
      }
      
      // Clean data
      if (result.email) result.email = String(result.email).toLowerCase();
      if (result.phone) result.phone = String(result.phone).replace(/[^\d+]/g, "");
      
      // Check if we extracted enough information to consider this successful
      if (isValidLead(result)) {
        return result;
      }
    }
    return null;
  } catch (error) {
    console.error("Error in structured data processing:", error);
    return null;
  }
}

// Process with AI for complex data
async function processWithAI(inputData: any) {
  const MAX_RETRIES = 2;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      const normalizedInput = normalizeInput(inputData);
      let formattedResponse = "";
      
      // Use a less expensive model for the first attempt
      const model = attempt === 0 
        ? "mistralai/Mistral-7B-Instruct-v0.2" 
        : "meta-llama/Llama-3.3-70B-Instruct-Turbo";
      
      const response = await together.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: normalizedInput }
        ],
        model: model,
        temperature: 0,
        top_p: 1,
        max_tokens: 500,
        stream: true,
      });

      for await (const token of response) {
        if (token.choices[0]?.delta?.content) {
          formattedResponse += token.choices[0].delta.content;
        }
      }

      // Find the JSON object in the response
      const match = formattedResponse.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("No JSON found in AI response");
      }

      return JSON.parse(match[0]);
    } catch (error) {
      console.error(`AI processing attempt ${attempt + 1} failed:`, error);
      attempt++;
      
      // Wait before retry (exponential backoff)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // If all AI attempts fail, use fallback
  return createFallbackData(inputData);
}

// Fallback data processing
function createFallbackData(data: any) {
  const result = {
    name: "",
    email: "",
    phone: "",
    message: "",
    custom_data: {} as Record<string, any>
  };

  try {
    const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
    // If it's an object, process all its fields
    if (typeof inputData === "object" && !Array.isArray(inputData)) {
      Object.entries(inputData).forEach(([key, value]) => {
        const cleanKey = key.replace(/[_\s]/g, "").toLowerCase();
        result.custom_data[cleanKey] = value;
        
        // Try to extract basic fields
        if (/mail|email/i.test(key) && typeof value === 'string') {
          result.email = value.toLowerCase();
        } else if (/phone|mobile|cell/i.test(key) && typeof value === 'string') {
          result.phone = value.replace(/[^\d+]/g, "");
        } else if (/name/i.test(key) && typeof value === 'string') {
          result.name = value;
        } else if (/message|comment|note/i.test(key) && typeof value === 'string') {
          result.message = value;
        }
      });
    }
    // If it's an array, process each item
    else if (Array.isArray(inputData)) {
      inputData.forEach((field) => {
        if (field.name && field.value !== undefined) {
          const cleanKey = field.name.replace(/[_\s]/g, "").toLowerCase();
          result.custom_data[cleanKey] = field.value;
          
          // Try to extract basic fields
          if (/mail|email/i.test(field.name) && typeof field.value === 'string') {
            result.email = field.value.toLowerCase();
          } else if (/phone|mobile|cell/i.test(field.name) && typeof field.value === 'string') {
            result.phone = field.value.replace(/[^\d+]/g, "");
          } else if (/name/i.test(field.name) && typeof field.value === 'string') {
            result.name = field.value;
          } else if (/message|comment|note/i.test(field.name) && typeof field.value === 'string') {
            result.message = field.value;
          }
        }
      });
    } else {
      // Just store the raw data
      result.custom_data.raw_data = data;
    }

    return result;
  } catch (error) {
    console.error("Fallback processing error:", error);
    return {
      ...result,
      custom_data: { raw_data: String(data) }
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS
  const corsHandler = cors({
    origin: "*", // Consider restricting in production
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  await runMiddleware(req, res, corsHandler);

  // Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { body, query } = req;
    const sourceWebhook = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/leads?action=getLeads&sourceId=${query.sourceId}&workspaceId=${
      query.workspaceId
    }`;
    
    if (!body) {
      return res.status(400).json({ error: "No data provided" });
    }

    // TIERED APPROACH: Try simpler methods first, then fall back to AI
    
    // Step 1: Try to process as structured data first (cheapest)
    let processedData = processStructuredData(body);
    
    // Step 2: If that fails, use AI (more expensive)
    if (!processedData) {
      console.log("Structured processing failed, using AI processing");
      processedData = await processWithAI(body);
    }
    
    // Add any explicit custom_data from request
    if (body.custom_data && processedData) {
      processedData.custom_data = {
        ...processedData.custom_data,
        ...body.custom_data,
      };
    }

    // Validate the processed data
    if (!isValidLead(processedData)) {
      return res.status(400).json({
        error: "Invalid lead data",
        details: "Name, email, or phone number is required",
        data: processedData,
      });
    }

    // Check webhook validity
    const { data: webhookMatch, error: webhookError } = await supabase
      .from("webhooks")
      .select("user_id,status")
      .eq("webhook_url", sourceWebhook)
      .single();
    
    if (webhookError) {
      console.error("Error fetching webhook:", webhookError.message);
      throw new Error("Failed to fetch webhook details.");
    }
    
    if (!webhookMatch || webhookMatch.status !== true) {
      console.error("Webhook deactivated or not found.");
      throw new Error("Webhook deactivated.");
    }

    // Validate contact details (in parallel)
    const [isEmailValid, isPhoneValid] = await Promise.all([
      processedData?.email ? validateEmail(processedData.email) : Promise.resolve(false),
      processedData?.phone ? validatePhoneNumber(processedData.phone) : Promise.resolve(false)
    ]);

    // Add metadata
    const leadData = {
      ...processedData,
      created_at: new Date().toISOString(),
      source: req.headers["origin"] || "unknown",
      lead_source_id: query.sourceId,
      user_id: webhookMatch?.user_id,
      contact_method: "Call",
      status: {
        name: "Arrived",
        color: "#FFA500",
      },
      work_id: query.workspaceId,
      revenue: 0,
      is_email_valid: isEmailValid,
      is_phone_valid: isPhoneValid,
    };

    // Save to database
    const { data: savedData, error: dbError } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    if (dbError) throw dbError;

    return res.status(200).json({
      message: "Lead successfully saved",
      lead: savedData[0],
    });
  } catch (error: any) {
    console.error("Error processing lead:", error);
    return res.status(500).json({
      error: "Failed to process lead",
      details: error.message,
    });
  }
}