export interface Lead {
  id: string;
  workspace_id: string;
  lead_source_id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'new' | 'in_progress' | 'contacted' | 'qualified' | 'unqualified' | 'closed';
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  workspace_id: string;
  name: string;
  type: 'form' | 'website' | 'social_media' | 'referral' | 'other';
  description?: string;
  is_active: boolean;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomForm {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  html_content: string;
  css_content?: string;
  js_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  lead_source_id?: string;
  data: Record<string, any>;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  workspace_id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'phone';
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  content?: string;
  template_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingTemplate {
  id: string;
  workspace_id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  content: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}
