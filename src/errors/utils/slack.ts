import { Request } from "express";

/**
 * Send error notification to Slack webhook
 * Only notifies for 5xx errors (critical issues)
 * @param error - Error instance
 * @param statusCode - HTTP status code
 * @param req - Express request object
 * @returns Promise<boolean> - Whether notification was successful
 */
export const notifySlack = async (error: Error, statusCode: number, req: Request): Promise<boolean> => {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return false;
    }

    // Only notify for critical errors (5xx status codes)
    if (statusCode < 500) {
      return false;
    }

    const payload = {
      text: `🚨 Error in Tourist Guide API`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* ${error.message}\n*Status:* ${statusCode}\n*Route:* ${req.method} ${req.path}\n*Time:* ${new Date().toISOString()}`,
          },
        },
      ],
    };

    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (slackError) {
    console.error("Failed to send Slack notification:", slackError);
    return false;
  }
};
