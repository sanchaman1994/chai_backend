// Import the necessary modules from mongoose
import mongoose, { Schema } from "mongoose";

// Define the schema for a subscription
const subscriptionSchema = new Schema(
  {
    // The subscriber field will be an ObjectId
    // This field will reference documents in the User collection
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // The channel field will also be an ObjectId
    // This field will reference documents in the User collection
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    // Enable timestamps to record createdAt and updatedAt dates
    timestamps: true,
  }
);

// Export the Subscription model
// This model will allow us to perform CRUD operations on the Subscriptions collection
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
