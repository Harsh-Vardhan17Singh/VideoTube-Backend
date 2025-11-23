/*
id dtring pk
username string
email string
fullname string
avatar string
coverImage string
watchHistory ObjectId[] videos
password string
refreshToken string
createdAt Date
UpdatedAt Date

*/

import mongoose , {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            loweracse:true,
            trim:true,
            index:true
        },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            // This means each item in the array is not raw data but an ObjectId.
            //In MongoDB an object is a special unique ID automatically created for every document.

            type:Schema.Types.ObjectId,
            ref:"Video"

            //ref tells Mongoose that this ObjectId refers to document in another collection (here "Video" is the collection )
            // it creates a relationship between watchHistory field and the video collection.
        }
    ],
    password:{
        type:String,
        required:[true, "password is required"]
    },
    refreshToken:{
        type:String
    }
  },
  {timestamps: true}
)



userSchema.pre("save",async function (next) {
    //fixed modofied part after error in postman
    if(!this.isModified("password")) return next()
    
    this.password = bcrypt.hash(this.password, 10)

    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
     return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    // short lived Access token
     return jwt.sign({
     _id: this._id,
     email:this.email,
     username:this.username,
     fullname:this.fullname
     },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
)
}

userSchema.methods.generateRefreshToken = function(){
    // short lived refresh token 
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}

);
}


export const User = mongoose.model("User", userSchema)