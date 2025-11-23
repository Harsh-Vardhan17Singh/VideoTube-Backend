import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

//configure cloudinary
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY , 
        api_secret:process.env.CLOUDINARY_API_SECRET 
    });

    const uploadOnCloudinary = async(localFilePath) =>{
        try {
            // console.log("Cloudinary Config:",{
            //     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
            //     api_key:process.env.CLOUDINARY_API_KEY,
            //     api_secret:process.env.CLOUDINARY_API_SECRET
            // });

            if(!localFilePath) return null
            const response = await cloudinary.uploader.upload(
                localFilePath,{
                    resource_type:"auto"
                }
            )

            console.log("File upload On Cloudinary.  File src: "+ response.url);
            // once the File is uploaded, We would Like to delete It from our Server

            fs.unlinkSync(localFilePath)
            return response


        } catch (error) {
            Console.log("Error on Cloudinary",error)
            fs.unlinkSync(localFilePath)
            return null
        }
    }

    const deletefromCloudinary = async (publicId) => {
        try {
           cloudinary.uploader.destroy(publicId)
           consol.log("Deleted from Cloudinary") 
        } catch (error) {
            console.log("Error deleting from Cloudinary. Public Id", publicId)
        }
    }

    export {uploadOnCloudinary, deletefromCloudinary}