import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { Emp } from "../models/employee.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
// const path = require('path');
import path from "path"
import moment from "moment";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await Emp.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerEmp = asyncHandler(async (req, res) => {



    const {
        firstname,
        lastname,
        DOB,
        phone,
        email,
        // profileImage,

        favorite,
        password,
        role,
    } = req.body;



    if (
        [
            firstname,
            DOB,
            phone,
            email,
            password,
        ].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedEmp = await Emp.findOne({
        $or: [{ phone }, { email }]
    })

    if (existedEmp) {
        throw new ApiError(409, "User with email or phone number already exists")
    }



    let flag = false
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.profileImage) && req.files.profileImage.length > 0) {
        coverImageLocalPath = req.files.profileImage[0].path
    }
    else {
        flag = true
        coverImageLocalPath = path.join(__dirname, '..', 'static', 'Defualt.png');
    }

    console.log("777777777777777777777777777777777777", coverImageLocalPath);
    // console.log(profileImage);


    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    const profileImage2 = await uploadOnCloudinary(coverImageLocalPath, flag)


    // console.log(coverImageLocalPath);
    // console.log(profileImage);
    const emp = await Emp.create({
        firstname,
        lastname,
        DOB,
        phone,
        email,
        profileImage: profileImage2?.url || "",
        favorite,
        password,
        role,
    })

    const createdUser = await Emp.findById(emp._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, password } = req.body
    console.log(email);

    if (!email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

    const emp = await Emp.findOne({ email })

    if (!emp) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await emp.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(emp._id)

    const loggedInUser = await Emp.findById(emp._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    emp: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await Emp.findByIdAndUpdate(
        req.emp._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

// const refreshAccessToken = asyncHandler(async (req, res) => {
//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

//     if (!incomingRefreshToken) {
//         throw new ApiError(401, "unauthorized request")
//     }

//     try {
//         const decodedToken = jwt.verify(
//             incomingRefreshToken,
//             process.env.REFRESH_TOKEN_SECRET
//         )

//         const user = await User.findById(decodedToken?._id)

//         if (!user) {
//             throw new ApiError(401, "Invalid refresh token")
//         }

//         if (incomingRefreshToken !== user?.refreshToken) {
//             throw new ApiError(401, "Refresh token is expired or used")

//         }

//         const options = {
//             httpOnly: true,
//             secure: true
//         }

//         const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

//         return res
//             .status(200)
//             .cookie("accessToken", accessToken, options)
//             .cookie("refreshToken", newRefreshToken, options)
//             .json(
//                 new ApiResponse(
//                     200,
//                     { accessToken, refreshToken: newRefreshToken },
//                     "Access token refreshed"
//                 )
//             )
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid refresh token")
//     }

// })

// const changeCurrentPassword = asyncHandler(async (req, res) => {
//     const { oldPassword, newPassword } = req.body

//     const user = await User.findById(req.user?._id)
//     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

//     if (!isPasswordCorrect) {
//         throw new ApiError(400, "Invalid old password")
//     }

//     user.password = newPassword
//     await user.save({ validateBeforeSave: false })

//     return res
//         .status(200)
//         .json(new ApiResponse(200, {}, "Password changed successfully"))
// })

const getCurrentEmp = asyncHandler(async (req, res) => {

    const empDetails = await Emp.findById(req.emp._id).select("firstname lastname email phone profileImage role DOB")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            empDetails,
            "User fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, phone, role, DOB } = req.body;
  const emp = await Emp.findByIdAndUpdate(
    req.emp?._id,
    {
      $set: {
        firstname:firstname,
        lastname:lastname,
        DOB:DOB,
        phone:phone,
        email:email,
        role:role,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, emp, "Account details updated successfully"));
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const emp = await Emp.findById(req.emp?._id)
    const isPasswordCorrect = await emp.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    emp.password = newPassword
    await emp.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const onBirthdayToday = asyncHandler(async (req, res) => {
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // const day = today.getDate();
    // const month = today.getMonth() + 1;
    // const birthdayEmployees = await Emp.find({
    //     $expr: {
    //         $and: [
    //             { $eq: [{ $dayOfMonth: "$DOB" }, day] },
    //             { $eq: [{ $month: "$DOB" }, month] },
    //         ],
    //     },
    // });


    const today = moment().format('MM-DD');

    const birthdayEmployees = await Emp.find({
        $expr: {
            $eq: [
                { $concat: [{ $substrCP: ['$DOB', 5, 2] }, '-', { $substrCP: ['$DOB', 8, 2] }] },
                today,
            ],
        },
    }).select("firstname lastname role phone profileImage");


    return res.status(200).json(new ApiResponse(200, birthdayEmployees, "Birthday for today fetched successfully"));
});

const updateProfileImage = asyncHandler(async (req, res) => {


    let flag = false
    let profileImageLocalPath = req.file?.path
    if (profileImageLocalPath) {
        flag = false
    }
    else {
        flag = true
        profileImageLocalPath = path.join(__dirname, '..', 'static', 'Defualt.png');
    }

    const profileImage = await uploadOnCloudinary(profileImageLocalPath, flag)
    if (!profileImage.url) {
        throw new ApiError(400, "Error while uploading on profileImage")
    }
    const emp = await Emp.findByIdAndUpdate(
        req.emp?._id,
        {
            $set: {
                profileImage: profileImage.url
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, emp, "Profile image updated successfully")
        )
})

export {
    registerEmp,
    loginUser,
    logoutUser,
    // refreshAccessToken,
    changeCurrentPassword,
    getCurrentEmp,
    onBirthdayToday,
    updateProfileImage,
    updateAccountDetails
    
}