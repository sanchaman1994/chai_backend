import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'


// This function generates access and refresh tokens for a given user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Find the user by their ID
    const user = await User.findById(userId);

    // Generate an access token for the user
    const accessToken = user.generateAcessToken();

    // Generate a refresh token for the user
    const refreshToken = user.generateRefreshToken();

    // Store the refresh token on the user object
    user.refreshToken = refreshToken;

    // Save the updated user object to the database
    // The "validationBeforeSave:false" option is used to skip validation
    await user.save("validationBeforeSave:false");

    // Return the newly generated access and refresh tokens
    return { accessToken, refreshToken };
  } catch (err) {
    // If anything goes wrong, throw an API error with a 500 status code
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
  }
};

// Define the registerUser function using the asyncHandler middleware
const registerUser = asyncHandler(async (req, res) => {
  // Destructure the fullname, username, email, and password from the request body
  const { fullname, username, email, password } = req.body;

  // Check if any of the required fields are missing
  if (
    [fullname, email.username, password].some((field) => field?.trim() === "")
  ) {
    // If a required field is missing, throw an error
    throw new ApiError("Fullname is required", 400);
  }

  // Check if a user with the given username or email already exists
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If a user with the given username or email already exists, throw an error
  if (existUser) {
    throw new ApiError(409, "user with email already exist");
  }

  // Get the path of the avatar image from the request files
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  // Get the path of the cover image from the request files
  const coverImageLocalPath = req.files?.cover?.[0]?.path;

  // If the avatar image is not provided, throw an error
  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  // Upload the avatar image to Cloudinary and get the resulting URL
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Upload the cover image to Cloudinary and get the resulting URL
  const coverPicture = await uploadOnCloudinary(coverImageLocalPath);

  // Create a new user with the provided data and the URLs of the uploaded images
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    cover: coverPicture?.url || "",
    avatar: avatar?.url,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  if (!createdUser) {
    throw new ApiError("Something went wrong while registering user", 500);
  }
  // console.log(res);
  return res
    .status(201)
    .json(new ApiResponse(200, "user registered successfully", createdUser));
});



const logInUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError("Email is required", 400);
  }

  // const user = await User.findOne({
  //   $or: [{ username }, { email }],
  // });
  const user = await User.findOne({ email })

  if (!user) {
    throw new ApiError("User doesnot exist.", 404);
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password Incorrect kindly check and retry.")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "user logged in successfully", {
        user: loggedInUser, accessToken, refreshToken
      })
    )

})

// Handler for logging out a user
const logoutUser = asyncHandler(async (req, res) => {
  // Update the user's record, removing the refresh token
  const userId = User.findByIdAndUpdate(
    req.user._id, // User's ID from the request
    {
      $set: { refreshtoken: undefined } // Unset the refresh token
    },
    {
      new: true // Return the new updated user record
    }
  );

  // Set cookie options
  const options = {
    httpOnly: true, // Accessible only through the HTTP protocol
    secure: true // Only transmitted over secure protocol as https
  };

  // Clear cookies and return response
  return res.status(200) // Return status 200
    .clearCookie("accessToken", options) // Clear the access token cookie
    .clearCookie("refreshtoken", options) // Clear the refresh token cookie
    .json(new ApiResponse(200, {}, "user logged out successfully")); // Return success message
});




// This function is responsible for refreshing the access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // We get the incoming refresh token from the cookies or from the body of the request
  const incommingRefreshToken = req.cookies.refreshToken = req.cookies || req.body.refreshToken;

  // If there is no incoming refresh token, we throw an error
  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized token");
  }

  // We decode the incoming refresh token using the secret key
  const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  // We find the user associated with this token
  const user = await User.findById(decodedToken?._id);

  // If there is no user associated with this token, we throw an error
  if (!user) {
    throw new ApiError(404, "invalid refresh token")
  }

  // If the incoming refresh token is not the same as the one stored in the user model, we throw an error
  if (incommingRefreshToken !== user?.refreshtoken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  // We set the options for the cookies
  const options = {
    httpOnly: true,
    secure: true,
  }

  // We generate a new access token and refresh token
  const { accessToken, newrefreshtoken } = await generateAccessAndRefreshTojens(user._id)

  // We send a response with the new tokens and set them as cookies
  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshtoken, options)
    .json(new ApiResponse(200, refreshToken = newrefreshtoken, accessToken, "ref"))

})


// Define handler to change current user password
const changeCureentPassword = asyncHandler(async (req, res) => {
  // Extract old and new passwords from request body
  const { oldPassword, newPassword } = req.body;

  // Get user ID from request user object
  const userId = req.user?._id;

  // Find user by ID
  const user = await User.findById(userId);

  // Check if the old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // If the old password is not correct, throw an error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect")
  }

  // Update the user's password
  user.password = newPassword;

  // Save the user with the new password, skip validation
  await user.save({ validateBeforeSave: false });

  // Return a success status and message
  return res.status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(new ApiResponse(200, req.user, "user fetch successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "fullname and email are required");
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      fullname,
      email
    }

  },
    {
      new: true,
    }).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

/**
 * Endpoint handler for updating the user's avatar.
 * This function will handle the upload of the user's avatar to cloudinary and update the user's profile in the database.
 * @async
 * @function
 * @param {Object} req - Express request object, expects a file in the request (avatar image).
 * @param {Object} res - Express response object.
 * @throws {ApiError} - Throws error with status code 400 if avatar image is missing or there's an error while uploading to Cloudinary.
 */
const updateUsearAvatar = asyncHandler(async (req, res) => {
  // Extract the user id from the request object
  const userId = req.user._id;

  // Get the local path of the avatar image from the request object
  const avatarLocalPath = req.file?.path;

  // If there is no avatar image in the request, throw an error
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is missing");
  }

  // Upload the avatar image to Cloudinary and get the URL
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // If there was an error while uploading the avatar to Cloudinary, throw an error
  if (!avatar) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // Update the user's avatar URL in the database and get the updated user object
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      avatar: avatar.url,
    }
  }, {
    new: true,
  }).select("-password")

  // TODO : delete old image after upload 

  // Send the updated user object in the response
  return res.status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"))
})


/**
 * Endpoint handler for updating the user's cover image.
 * This function will handle the upload of the user's cover image to cloudinary and update the user's profile in the database.
 * @async
 * @function
 * @param {Object} req - Express request object, expects a file in the request (cover image).
 * @param {Object} res - Express response object.
 * @throws {ApiError} - Throws error with status code 400 if cover image is missing or there's an error while uploading to Cloudinary.
 * @returns {Object} - Returns a response with status 200 and JSON of user data (without password) if successful.
 */
const updateUsearCover = asyncHandler(async (req, res) => {
  // Get user id from request user object
  const userId = req.user._id;

  // Get path of cover image from request file object
  const coverLocalPath = req.file?.path;

  // If cover image path doesn't exist, throw an ApiError
  if (!coverLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }

  // Upload cover image to cloudinary
  const cover = await uploadOnCloudinary(coverLocalPath);

  // If uploading to cloudinary fails, throw an ApiError
  if (!cover) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  // Find user by id and update their cover image, and return the updated user data without the password
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      cover: cover.url,
    }
  }, {
    new: true,
  }).select("-password")

  // Return a successful response with user data and a success message
  return res.status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))
})



/*
 * Handler function for fetching the profile of a user's channel.
 * Uses mongoose aggregate function to join user's data with subscription data,
 * and returns the profile information along with subscribers count and subscription status.
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Destructure username from request parameters
  const { username } = req.params;

  // Throw an error if username is not provided
  if (!username?.trim()) {
    throw new ApiError(400, "username is required")
  }

  // Use mongoose aggregate function to fetch user's channel data
  const channel = await User.aggregate([
    {
      // Find the user with the requested username
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      // Left join with subscriptions collection to get the subscribers of the channel
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      // Left join with subscriptions collection to get the channels this user is subscribed to
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      // Add new fields: subscribers count, subscribed channels count and subscription status of the current user
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubcribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: { // Conditional statement to check if the current user is subscribed to this channel
            if: { $in: [mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"] },
            then: true,
            else: false,
          }
        }
      }
    },
    {
      // Project only the necessary fields to be returned in the response
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubcribedToCount: 1,
        isSubscribed: 1,
        email: 1,
        avatar: 1,
        cover: 1
      }
    }
  ])

  // If no channel found, throw a 404 error
  if (!channel?.length) {
    throw new ApiError(404, "channel not found")
  }

  // Send the profile data of the channel as the response
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fetch successfully"))
})


const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  }
                }

              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
    .status(200)
    .json(new ApiResponse(200, user[0], "watch history fetched successfully..."))
})





export {
  registerUser, logInUser, logoutUser,
  refreshAccessToken, changeCureentPassword,
  updateAccountDetails, updateUsearAvatar,
  updateUsearCover, getUserChannelProfile,
  getWatchHistory, getCurrentUser
};

