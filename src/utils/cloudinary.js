import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     //upload the file on cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });
//     //file has been uploaded succefull
//     console.log("file has been uploaded succefull", response.url);
//     return response;
//   } catch (err) {
//     fs.unlinkSync(localFilePath); //remove the locally saved tem file as the upload failed
//     return null;
//   }
// };

// export { uploadOnCloudinary };

// This function uploads a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Check if the file path is provided
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Log the success message along with the URL of the uploaded file
    console.log("File has been uploaded successfully", response.url);

    // Return the response from Cloudinary
    return response;
  } catch (err) {
    // If there is an error, delete the local temporary file
    fs.unlinkSync(localFilePath);

    // Return null indicating that the upload failed
    return null;
  }
};
export { uploadOnCloudinary };
