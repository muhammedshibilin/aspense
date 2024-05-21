const multer = require('multer')


const productStorage = multer.diskStorage({
    destination: "/public/images/product/original",
    filename: (req, file, cb) => {
        const filename = file.originalname;
        cb(null, filename)
    }
})

const productUpload = multer({ 
  storage: productStorage ,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const uploadProduct = productUpload.array('images[]');

  const userStorage = multer.diskStorage({

    destination: "public/images/user/",
  
    filename: (req, file, cb)=> {
  
      const filename = file.originalname;
      cb(null, filename)
  
    }
  
  })
  const uploadProfile =multer({storage:userStorage})

module.exports ={
    uploadProduct,
    uploadProfile
}