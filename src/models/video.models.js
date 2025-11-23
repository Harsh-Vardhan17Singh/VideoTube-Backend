/*
Owner ObjectId users
videoFile String
thumbnail string
title string
description string
duration number
views number
isPublished boolean 
createdAt Date
updateAt Date
*/

import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema({
    videiFile:{
        type:String, //cloudinary url
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    views:{
        type:Number,
        required:true
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.types.ObjectId,
        ref:"User"

    },
    
}, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)