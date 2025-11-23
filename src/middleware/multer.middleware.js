import multer from "multer"


const storage = multer.diskStorage({
    // It is for the destination  function which has a reuest , file , callback in which there is destination for storing the file
    destination:function(req,file,cb) {
        cb(null,'./public/temp')
    },
    filename: function (req,file,cb) {
        //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
})