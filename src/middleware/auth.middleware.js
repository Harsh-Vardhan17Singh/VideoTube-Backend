import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {asynchandler} from "../utils/asynchandler.js"

export const verifyJWT = asynchandler(async(req,_,next) =>
{
   const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","")


   //checking for token
    if(!token){
        throw new ApiError(401,"Unauthorized")
    }
    //decodeding the token
    try {
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401,"Unauthorized")
        }

        req.user = user

        next()   // this next is imp as it behaves like a flag in this which transfer data from one middleware to controllers

       


    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access Token")
    }
   

})