
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Function to connect to MongoDB database
const connectDB = async () => {
  try {
    // Establish connection to MongoDB using the connection URI and DB_NAME
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    
    // Log successful connection message with the host name
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // Log error message if connection fails
    console.log("MONGODB connection FAILED ", error);
    
    // Exit the process with a failure code
    process.exit(1);
  }
};

// Export the connectDB function for use in other modules
export default connectDB;
