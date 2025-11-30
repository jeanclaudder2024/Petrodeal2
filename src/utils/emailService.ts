/**
 * Email Service Utility
 * Handles email sending, template processing, and placeholder replacement
 */

export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  templateId?: string;
  placeholders?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface PlaceholderData {
  // Author/User
  author_name?: string;
  user_email?: string;
  member_id?: string;
  
  // Manuscript
  manuscript_title?: string;
  manuscript_id?: string;
  submission_id?: string;
  doi?: string;
  status?: string;
  
  // Review
  reviewer_name?: string;
  review_link?: string;
  deadline?: string;
  decision?: string;
  
  // Payment
  amount?: number | string;
  currency?: string;
  invoice_number?: string;
  transaction_id?: string;
  payment_method?: string;
  
  // Support
  support_subject?: string;
  support_id?: string;
  ticket_url?: string;
  
  // System (auto-filled)
  current_date?: string;
  current_year?: string;
  platform_name?: string;
  platform_url?: string;
  
  // Custom
  [key: string]: any;
}

/**
 * Replace placeholders in text with actual values
 */
export function replacePlaceholders(
  text: string,
  data: PlaceholderData = {}
): string {
  let result = text;
  
  // System placeholders (always available)
  const systemData = {
    current_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    current_year: new Date().getFullYear().toString(),
    platform_name: data.platform_name || 'PetroDealHub',
    platform_url: data.platform_url || 'https://petrodealhub.com',
  };
  
  // Merge system data with provided data
  const allData = { ...systemData, ...data };
  
  // Replace all placeholders
  Object.keys(allData).forEach(key => {
    const value = allData[key];
    if (value !== undefined && value !== null) {
      // Replace {{key}} format
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });
  
  return result;
}

/**
 * Send email using SMTP configuration
 */
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    return { success: true, message: data.message };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send email using a template
 */
export async function sendEmailWithTemplate(
  templateId: string,
  to: string | string[],
  placeholders: PlaceholderData = {}
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // First, fetch the template
    const { data: template, error: templateError } = await fetch('/api/email/templates/' + templateId)
      .then(res => res.json());

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Replace placeholders
    const subject = replacePlaceholders(template.subject, placeholders);
    const body = replacePlaceholders(template.body, placeholders);

    // Send email
    return await sendEmail({
      to,
      subject,
      body,
      templateId,
      placeholders,
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send email with template' };
  }
}

/**
 * Process and send bulk emails
 */
export async function sendBulkEmails(
  templateId: string,
  recipients: Array<{ email: string; placeholders?: PlaceholderData }>
): Promise<{ success: number; failed: number; errors?: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendEmailWithTemplate(
      templateId,
      recipient.email,
      recipient.placeholders || {}
    );

    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(`${recipient.email}: ${result.error}`);
    }
  }

  return { success, failed, errors: errors.length > 0 ? errors : undefined };
}

