import {asynchandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { deletefromCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) =>{
   try {
    const user = await User.findById(userId)
    //small check for user existence

    // throwing Error if User is not find
    if(!user){
        throw new ApiError(404,"User Not Found")
    }
 
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


 
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
 
     return {accessToken, refreshToken}


   } catch (error) {
    throw new ApiError(500,"Something went wrong while  generating access and refresh tokens")
   }
}


const registerUser = asynchandler(async(req,res) => {
    const {fullname, email,username, password} = req.body

    console.log(req.files)

    //validation
    if(
        //so this checks whether any field is empty or not

        // (field?) -> optional chaining ensures if the field is null or undefined it won't crash 
        [fullname,email,username,password].some((field) =>
        field?.trim() === "")
    ){
        // if any of the field is empty then the if becomes true
        throw new ApiError(400 ,"All Fields are Required")

    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(400,"User with email or username already exists")
    }
    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverlocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    // const avatar = await uploadOnCloudinary(avatarLocalPath)


    // let coverImage = ""

    // if (coverlocalPath) {
    //  coverImage  = await uploadOnCloudinary(coverlocalPath)  
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded Avatar",avatar)
    } catch (error) {
        console.log("Error uploading avatar", error)
        throw new ApiError(500,"Failed to upload avatar")
        
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverlocalPath)
        console.log("Uploaded Avatar",coverImage)
    } catch (error) {
        console.log("Error uploading coverImage", error)
        throw new ApiError(500,"Failed to upload coverImage")
        
    }

    try {
        const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering a user")
    }

    return res
        .status(210)
        .json( new ApiResponse(200, createdUser,"User registered Successfully"))

    } catch (error) {
        console.log("User Creation failed")

        if(avatar){
            await deletefromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deletefromCloudinary(coverImage.public_id)
        }

        throw new ApiError(500,"Something went wrong while registering the user and images were deleted")
        
    } 

})

console.log("✅ user.routes.js loaded");

const loginUser = asynchandler(async (req,res) =>{
    //get data from body
    const {email,username,password} = req.body
    if (!email){
        throw new ApiError(400,"Email is Required")
    }
    const user = await User.findOne({
        $or: [{username} ,{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found")
    }
    //validate password

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"invalid credentials")
    }

    const{accessToken, refreshToken } =await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password, -refreshToken");
    const options = {
        httpOnly:true,
        secure: process.env.Node_ENV === "production",
    }
    return res
      .status(200)
      .cookie("accesToken",refreshToken,options)
      .jsn(new ApiResponse(
        200,
        {user:loggedInUser,accessToken,refreshToken},
        "User Logged in Successfully"
    ))

})

const logoutUser = asynchandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {new:true}

    )
    const options ={
        httpOnly:true,
        secure:process.env.NODE_ENV =="production",
    }
    return res 
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"User Logged out Successfully"))
})


const refreshAccessToken = asynchandler(async(req,res) =>{
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingrefreshToken){
        throw new ApiError(401,"Refresh Token Is Required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingrefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Inavlid rfresh token")
        }
        if(incomingrefreshToken !== user?.rereshToken){
            throw new ApiError(401,"Invalid Refresh Token")
        }

        const options={
            httpOnly:true,
            secure:process.env.NODE_ENV === "production"

        }

        const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken",newRefreshToken,options)
          .json(
            new ApiResponse(
                200,
                {accessToken,
                    refreshToken:newrefreshToken},
                    "Access token Refresh SuccessFully"
            ));

           } catch (error) {
        throw new ApiError(500,"Something went Wrong while refreshing access token")
        
    }
})

const changeCurrentPassword = asynchandler(async(req,res) =>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)
    
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(401,"old password is correct")
    }
    user.password = newPassword

    await user.save({vallidateBeforeSave : false})

    return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully"))

})

const getCurrentUser = asynchandler(async(req,res) => {
    return res.status(200).json(new ApiResponse(200,req.user,"Current User Details"))

})

const updateAccountDetails = asynchandler(async(req,res) => {
    const {fullname,email} = req.body

    if(!fullname ){
        throw new ApiError(400,"Fullname is Required")
    }
    if(!email){
        throw new ApiError(400,"Email is Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email,
            }
        },
        {new:true}
    ).select("-password -refreshToken")

})

const updateUserAvatar = asynchandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500,"Something Went Wrong while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Avatar updated Successfully"))

})

const updateUserCoverImage = asynchandler(async(req,res) => {
    const coverimageLocalPath = req.files?.path

    if(!coverimageLocalPath){
        throw new ApiError(400,"File is Required")
    }

    const coverImage = await uploadOnCloudinary(coverimageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,"Something went Wrong while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}

    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Cover Image updated Successfully"))
})
const getUserChannelProfile = asynchandler(async (req,res) => {
    const {username} = req.params
    if(!username.trim()){
        throw new ApiError(400,"Username is Required")
    }

    const channel = await User.aggregate(
        [
            {
               $match:{
                username:username?.toLowerCase()
               } 
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreginField:"subscriber",
                    as:"subscribedTo"

                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    
                        isSubscribed:{
                          $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                          }  
                        }
                    }
            },
            {
                //Project only the necessary data
                $project:{
                    fullname:1,
                    username:1,
                    avatar:1,
                    subcribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    email:1

                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404,"Channel not Found")
    }

    return res.status(200).json(new ApiResponse(
        200,
        channel,
        "Channel profile fetched Successfully"
    ))


})  
const getWatchHistory = asynchandler(async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id:new  mongoose.types.ObjectId(req.user?._id) //we cannot use req.user?._id deirectly in this operation , we have to use aggerate pipeline 
            }
        },
        {
            $lookup:{
                from:"video",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                $project:{
                                    fullname:1,
                                    username:1,
                                    avatar:1  
                                }
                                },
                                {
                                    $addFields:{
       owner:{
        $first:"owner"
       }                                 
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }

    ])

    return res.status(200).json(new ApiResponse(200,user[0]?.watchHistory,"Watch history fetched Successfully"))

})  




export{
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory


}