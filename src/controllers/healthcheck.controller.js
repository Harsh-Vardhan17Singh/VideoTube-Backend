import { ApiResponse } from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const healthcheck = asynchandler( async (req,res) =>{
    return res
    .status(200)
    .json( new ApiResponse(200,"OK","Health Check Passed"))
})

export {healthcheck}
