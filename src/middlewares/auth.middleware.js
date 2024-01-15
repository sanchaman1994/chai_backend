import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshtoken"
    );

    if (!user) {
      throw new ApiError(401, "invalid Access Token asssss");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token sdfdfs");
  }
});
