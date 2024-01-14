import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError("User doesnot exist.", 404);
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials")
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


export { registerUser, logInUser, logoutUser };
