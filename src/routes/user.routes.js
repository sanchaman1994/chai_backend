// Import necessary modules for routing and middleware
import { Router } from "express";
import {
  registerUser,
  logInUser,
  logoutUser,
  refreshAccessToken,
  changeCureentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUsearAvatar,
  updateUsearCover,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verify } from "jsonwebtoken";

// Initialize a router instance
const router = Router();

// Define route for user registration
// Upload middleware handles multipart form data for cover and avatar images
router.route("/register").post(
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  registerUser
);

// Define route for user login
router.route("/login").post(logInUser);

// Define route for user logout
// JWT verification middleware checks for valid access token
router.route("/logout").post(verifyJWT, logoutUser);

// Define route for refreshing JWT access token
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCureentPassword);

router.route("/current-user").get(verify, getCurrentUser);
router.route("/update-account").patch(verify, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUsearAvatar);

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("cover"), updateUsearCover);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

// Export the router to be used in other modules
export default router;
