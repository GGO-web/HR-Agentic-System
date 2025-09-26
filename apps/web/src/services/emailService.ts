interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface InvitationEmailData {
  candidateName: string
  candidateEmail: string
  jobTitle: string
  companyName: string
  invitationLink: string
  personalMessage?: string
}

/**
 * Mock email service - in production, integrate with a real email service
 * like SendGrid, Resend, or AWS SES
 */
export class EmailService {
  private static instance: EmailService

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    // Mock implementation - in production, replace with actual email service
    console.log("📧 Email would be sent:", {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    const subject = `Interview Invitation - ${data.jobTitle} at ${data.companyName}`

    const html = this.generateInvitationEmailHTML(data)
    const text = this.generateInvitationEmailText(data)

    await this.sendEmail({
      to: data.candidateEmail,
      subject,
      html,
      text,
    })
  }

  private generateInvitationEmailHTML(data: InvitationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0 0 10px 0;">Interview Invitation</h1>
            <p style="margin: 0; color: #666;">You've been invited to interview for a position at ${data.companyName}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">${data.jobTitle}</h2>
            
            <p style="margin: 0 0 15px 0;">Hello ${data.candidateName},</p>
            
            <p style="margin: 0 0 15px 0;">
              We're excited to invite you to interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
            </p>
            
            ${
              data.personalMessage
                ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; font-style: italic;">"${data.personalMessage}"</p>
              </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${data.invitationLink}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Accept Interview Invitation
              </a>
            </div>
            
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
              This invitation will expire in 7 days. If you have any questions, please don't hesitate to reach out.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              This invitation was sent by ${data.companyName}
            </p>
          </div>
        </body>
      </html>
    `
  }

  private generateInvitationEmailText(data: InvitationEmailData): string {
    return `
Interview Invitation - ${data.jobTitle} at ${data.companyName}

Hello ${data.candidateName},

We're excited to invite you to interview for the ${data.jobTitle} position at ${data.companyName}.

${data.personalMessage ? `Personal Message: "${data.personalMessage}"` : ""}

To accept this invitation, please click the following link:
${data.invitationLink}

This invitation will expire in 7 days. If you have any questions, please don't hesitate to reach out.

Best regards,
${data.companyName}
    `.trim()
  }
}

export const emailService = EmailService.getInstance()
