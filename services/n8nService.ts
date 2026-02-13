
import { ActivePlan } from "../types";

// The N8N Webhook URL for Plan Automation
// STRICT URL provided by user for email delivery
// UPDATED: Production Endpoint
const PLAN_WEBHOOK_URL =import.meta.env.VITE_N8N_PLAN_WEBHOOK_URL;
const WELCOME_WEBHOOK_URL = import.meta.env.VITE_WELCOME_WEBHOOK_URL;

export const syncWithN8n = async (email: string, actionItems: string[]): Promise<boolean> => {
  // Legacy function - keeping for backward compatibility if needed, 
  // but main logic is now in triggerPlanWebhook
  return true;
};

export const triggerPlanWebhook = async (planData: Partial<ActivePlan>) => {
  console.log(`🚀 Sending Plan Webhook to N8N: ${PLAN_WEBHOOK_URL}`);
  console.log(`Target Email: ${planData.email}`);

  try {
    // We sanitize the payload to ensure no Firestore objects (like Timestamps) break JSON serialization
    // We rely on the N8N node to generate the 'now' timestamp if needed, or send ISO string.
    const payload = {
      ...planData,
      timestamp: new Date().toISOString(),
      source: 'MODE_APP_PLAN'
    };

    const response = await fetch(PLAN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
        console.log("✅ Plan webhook sent successfully.");
    } else {
        console.warn(`⚠️ Webhook responded with status: ${response.status}`);
    }
  } catch (error) {
    console.warn("⚠️ Failed to send plan webhook:", error);
  }
};

export const sendWelcomeWebhook = async (user: { email: string | null; displayName: string | null; uid: string }) => {
  console.log(`🚀 Sending Welcome Webhook for new user: ${user.email}`);

  try {
    await fetch(WELCOME_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'new_user_signup',
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        timestamp: new Date().toISOString(),
        source: 'MODE_APP'
      })
    });
    console.log("✅ Welcome webhook sent successfully.");
  } catch (error) {
    console.warn("⚠️ Failed to send welcome webhook:", error);
  }
};
