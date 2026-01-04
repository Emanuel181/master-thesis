import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES Client
const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || "no-reply@vulniq.com";
const SITE_NAME = "VulnIQ";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vulniq.com";

/**
 * Send an email using AWS SES
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body (optional)
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          ...(text && { Text: { Data: text, Charset: "UTF-8" } }),
        },
      },
    });

    await ses.send(command);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Generate email HTML template
 */
function generateEmailTemplate({ title, content, actionUrl, actionText }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px 8px 0 0;">
              <img src="${SITE_URL}/favicon.png" alt="${SITE_NAME}" style="height: 40px; width: auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1e293b;">${title}</h1>
              <div style="color: #475569; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
              ${actionUrl ? `
              <div style="margin-top: 32px;">
                <a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">${actionText || "View Details"}</a>
              </div>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                This email was sent by ${SITE_NAME}. If you didn't expect this email, you can safely ignore it.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send article rejected notification email
 */
export async function sendArticleRejectedEmail({ to, articleTitle, feedback }) {
  const content = `
    <p>Your article <strong>"${articleTitle}"</strong> has been reviewed and requires revision.</p>
    ${feedback ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #991b1b;">Feedback from reviewer:</p>
      <p style="margin: 8px 0 0; color: #7f1d1d;">${feedback}</p>
    </div>
    ` : ""}
    <p>Please review the feedback and make the necessary changes. You can then resubmit your article for review.</p>
  `;

  return sendEmail({
    to,
    subject: `Article Needs Revision: ${articleTitle}`,
    html: generateEmailTemplate({
      title: "Article Needs Revision",
      content,
      actionUrl: `${SITE_URL}/dashboard?active=Write Article`,
      actionText: "View Your Articles",
    }),
  });
}

/**
 * Send article scheduled for deletion notification email
 */
export async function sendArticleScheduledForDeletionEmail({ to, articleTitle, feedback, deletionDate }) {
  const dateStr = new Date(deletionDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = `
    <p>Your article <strong>"${articleTitle}"</strong> has been scheduled for deletion.</p>
    <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #92400e;">Deletion Date: ${dateStr}</p>
    </div>
    ${feedback ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #991b1b;">Reason:</p>
      <p style="margin: 8px 0 0; color: #7f1d1d;">${feedback}</p>
    </div>
    ` : ""}
    <p><strong>Important:</strong> You can prevent deletion by importing this article back to your drafts before the deletion date.</p>
  `;

  return sendEmail({
    to,
    subject: `Article Scheduled for Deletion: ${articleTitle}`,
    html: generateEmailTemplate({
      title: "Article Scheduled for Deletion",
      content,
      actionUrl: `${SITE_URL}/dashboard?active=Write Article`,
      actionText: "View Your Articles",
    }),
  });
}

/**
 * Send article deleted notification email
 */
export async function sendArticleDeletedEmail({ to, articleTitle, feedback }) {
  const content = `
    <p>Your article <strong>"${articleTitle}"</strong> has been permanently deleted.</p>
    ${feedback ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-left: 4px solid #64748b; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #475569;">Reason:</p>
      <p style="margin: 8px 0 0; color: #64748b;">${feedback}</p>
    </div>
    ` : ""}
    <p>If you believe this was done in error, please contact our support team.</p>
  `;

  return sendEmail({
    to,
    subject: `Article Deleted: ${articleTitle}`,
    html: generateEmailTemplate({
      title: "Article Deleted",
      content,
    }),
  });
}

/**
 * Send article status changed notification email
 */
export async function sendArticleStatusChangedEmail({ to, articleTitle, newStatus, feedback }) {
  const statusMessages = {
    IN_REVIEW: {
      title: "Article Under Review",
      message: "Your article is now being reviewed by our team. We'll notify you once the review is complete.",
    },
    PUBLISHED: {
      title: "Article Published! 🎉",
      message: "Congratulations! Your article has been approved and is now live on our platform.",
    },
    PENDING_REVIEW: {
      title: "Article Status Updated",
      message: "Your article status has been changed to Pending Review.",
    },
    DRAFT: {
      title: "Article Moved to Drafts",
      message: "Your article has been moved back to drafts.",
    },
  };

  const statusInfo = statusMessages[newStatus] || {
    title: "Article Status Updated",
    message: `Your article status has been changed to ${newStatus}.`,
  };

  const content = `
    <p>Your article <strong>"${articleTitle}"</strong> status has been updated.</p>
    <div style="margin: 24px 0; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #06b6d4; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #0e7490;">${statusInfo.message}</p>
    </div>
    ${feedback ? `
    <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-left: 4px solid #64748b; border-radius: 4px;">
      <p style="margin: 0; font-weight: 500; color: #475569;">Note from reviewer:</p>
      <p style="margin: 8px 0 0; color: #64748b;">${feedback}</p>
    </div>
    ` : ""}
  `;

  return sendEmail({
    to,
    subject: `${statusInfo.title}: ${articleTitle}`,
    html: generateEmailTemplate({
      title: statusInfo.title,
      content,
      actionUrl: `${SITE_URL}/dashboard?active=Write Article`,
      actionText: "View Your Articles",
    }),
  });
}

export { sendEmail, generateEmailTemplate };

