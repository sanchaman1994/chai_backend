// Importing multer for handling multipart/form-data
import multer from "multer";

// Setup the storage for multer
const storage = multer.diskStorage({
  // Define the destination of the stored files
  destination: function (req, file, cb) {
    // Files will be stored in the "./public/temp" directory
    cb(null, "./public/temp");
  },
  // Define the naming convention of the files
  filename: function (req, file, cb) {
    // Files will be named as their original name
    cb(null, file.originalname);
  },
});

// Export a multer instance with the defined storage
export const upload = multer({
  storage: storage,
});
