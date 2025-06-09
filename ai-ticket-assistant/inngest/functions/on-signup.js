import { inngest } from "../client.js"; // Import the Inngest client
import User from "../../models/user.js";

// Import a special error type that tells Inngest not to retry this function if it's thrown
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";


// TLDR OF THE onUserSignup FUNCTION :
// This function runs when a user signs up, looks up their email in the database, and 
// sends them a welcome email. If the user is missing or something fails, it handles the 
// error gracefully.


// Create an Inngest function that triggers on the "user/signup" event
export const onUserSignup = inngest.createFunction(
  {
    id: "on-user-signup", // Function identifier
    retries: 2,           // Retry this function up to 2 times if it fails
  },
  { event: "user/signup" }, // The event that triggers this function
  async ({ event, step }) => {
    try {
      const { email } = event.data; // Extract email from event payload

      // Step 1: Retrieve user by email from the database
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });

        // If no user is found, throw a NonRetriableError to skip retries
        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }

        return userObject;
      });

      // Step 2: Send welcome email to the user
      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi,\n\nThanks for signing up. We're glad to have you onboard!`;
        await sendMail(user.email, subject, message);
      });

      // Return success
      return { success: true };

    } catch (error) {
        
      // Log error and return failure
      console.error("❌ Error running step", error.message);
      return { success: false };
    }
  }
);
