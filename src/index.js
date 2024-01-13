
// Load the environment variables
import dotenv from "dotenv";

// Import the function to connect to the database
import connectDB from "./db/index.js";

// Import the Express app configuration
import { app } from "./app.js";

// Configure dotenv for environment variables
dotenv.config();

// Connect to the database. Once the database connection is established, 
// the Express app begins to listen for requests on the specified port
connectDB().then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`App is Listening on port ${process.env.PORT}`);
  });
});





// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.error(error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is Listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// })();

