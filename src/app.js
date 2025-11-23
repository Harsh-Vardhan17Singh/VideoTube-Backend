import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials : true
    })
)
// commom middleware
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// import routes
import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import { errorHandler } from './middleware/error.middleware.js'


//routes


// this line means once you reached the healthcheck then the route will be transfered to healthcheckRouter
// and it returns the status,json,message to the response

app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter)

// app.use(errorHandler)


export { app }