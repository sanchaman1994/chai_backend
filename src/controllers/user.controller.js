import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { avatarClasses } from "@mui/material";


const generateAccessAndRefreshTojens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAcessToken()
    const refreshToken = user.generateRefreshToken();
    user.refreshtoken = refreshToken;
    await user.save("validationBeforeSave:false");

    return { accessToken, refreshToken };



  } catch (err) {
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, email.username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("Fullname is required", 400);
  }
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "user with email already exist");
  }


  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.cover?.[0]?.path;



  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverPicture = await uploadOnCloudinary(coverImageLocalPath);

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
  const { accessToken, refreshToken } = await generateAccessAndRefreshTojens(user._id);

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

const logoutUser = asyncHandler(async (req, res) => {
  const userId = User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshtoken: undefined }
    }, {
    new: true
  }
  )

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshtoken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookies.refreshToken = req.cookies || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized token");
  }
  const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(404, "invalid refresh token")
  }
  if (incommingRefreshToken !== user?.refreshtoken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  const { accessToken, newrefreshtoken } = await generateAccessAndRefreshTojens(user._id)

  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshtoken, options)
    .json(new ApiResponse(200, refreshToken = newrefreshtoken, accessToken, "ref"))

})


const changeCureentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?._id;
  const user = await User.findById(userId);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect")
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(200, req.user, "curernt user fetched successfully")
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
    .json(new ApiResponse(200, user, "account details updated successfully"))

})

const updateUsearAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      avatar: avatar.url,
    }
  }, {
    new: true,
  }).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "avatar image updated successfully"))

})


const updateUsearCover = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "cover iamge is missing");
  }
  const cover = await uploadOnCloudinary(coverLocalPath);

  if (!cover) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      cover: cover.url,
    }
  }, {
    new: true,
  }).select("-password")

  return res.status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"))
})


export {
  registerUser, logInUser, logoutUser,
  refreshAccessToken, changeCureentPassword,
  updateAccountDetails, updateUsearAvatar,
  updateUsearCover
};
