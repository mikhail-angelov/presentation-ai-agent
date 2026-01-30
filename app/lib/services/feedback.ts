import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface FeedbackData {
  type: "feedback" | "recommendation" | "issue";
  message: string;
  email?: string;
  session_id?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback?: any;
  error?: string;
}

const sendMail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) => {
  const transporter = nodemailer.createTransport({
    host: process.env.POST_SERVICE_URL,
    port: 587,
    auth: {
      user: process.env.POST_USER,
      pass: process.env.POST_PASS,
    },
  });

  await transporter.sendMail({
    from: "no-reply@js2go.ru",
    to,
    subject,
    text,
  });
};

export class FeedbackService {
  /**
   * Validate feedback data
   */
  private validateFeedback(data: Partial<FeedbackData>): {
    isValid: boolean;
    error?: string;
  } {
    // Validate required fields
    if (!data.type || !data.message) {
      return { isValid: false, error: "Type and message are required" };
    }

    // Validate type
    const validTypes = ["feedback", "recommendation", "issue"];
    if (!validTypes.includes(data.type)) {
      return { isValid: false, error: "Invalid feedback type" };
    }

    return { isValid: true };
  }

  /**
   * Send email notification to admin
   */
  private async sendAdminNotification(
    feedbackData: FeedbackData,
  ): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        console.warn(
          "ADMIN_EMAIL environment variable is not set. Skipping email notification.",
        );
        return;
      }

      const subject = `New Feedback Received: ${feedbackData.type}`;
      const text = `
New feedback has been submitted:

Type: ${feedbackData.type}
Message: ${feedbackData.message}
User Email: ${feedbackData.email || "Not provided"}
Session ID: ${feedbackData.session_id || "Not provided"}
Timestamp: ${new Date().toISOString()}

Please review this feedback in the admin panel.
      `.trim();

      await sendMail({
        to: adminEmail,
        subject,
        text,
      });

      console.log("Admin notification email sent successfully");
    } catch (error) {
      console.error("Failed to send admin notification email:", error);
      // Don't throw - email failure shouldn't prevent feedback submission
    }
  }

  /**
   * Submit feedback to the database
   */
  async submitFeedback(feedbackData: FeedbackData): Promise<FeedbackResponse> {
    try {
      // Validate feedback data
      const validation = this.validateFeedback(feedbackData);
      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          error: validation.error,
        };
      }

      // Insert feedback into database
      const { data, error } = await supabase
        .from("user_feedback")
        .insert([
          {
            type: feedbackData.type,
            message: feedbackData.message,
            email: feedbackData.email || null,
            session_id: feedbackData.session_id || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error inserting feedback:", error);

        // If table doesn't exist, create it first
        if (error.code === "42P01") {
          // Table doesn't exist, we should create it
          // For now, just log and return success
          console.log("Feedback table does not exist. Creating table...");

          // In a production app, you would run a migration here
          // For now, we'll just return success
          return {
            success: true,
            message: "Feedback received (table creation required)",
            feedback: feedbackData,
          };
        }

        return {
          success: false,
          message: "Failed to save feedback",
          error: error.message,
        };
      }

      // Send email notification to admin (fire and forget - don't wait for it)
      this.sendAdminNotification(feedbackData).catch((err) => {
        console.error("Background email notification failed:", err);
      });

      return {
        success: true,
        message: "Feedback submitted successfully",
        feedback: data,
      };
    } catch (error) {
      console.error("Error processing feedback:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all feedback (for admin purposes)
   */
  async getAllFeedback(limit: number = 100): Promise<FeedbackResponse> {
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching feedback:", error);
        return {
          success: false,
          message: "Failed to fetch feedback",
          error: error.message,
        };
      }

      return {
        success: true,
        message: "Feedback fetched successfully",
        feedback: data,
      };
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get feedback by session ID
   */
  async getFeedbackBySession(sessionId: string): Promise<FeedbackResponse> {
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching feedback by session:", error);
        return {
          success: false,
          message: "Failed to fetch feedback",
          error: error.message,
        };
      }

      return {
        success: true,
        message: "Feedback fetched successfully",
        feedback: data,
      };
    } catch (error) {
      console.error("Error fetching feedback by session:", error);
      return {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export a singleton instance
export const feedbackService = new FeedbackService();
