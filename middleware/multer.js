const multer = require('multer')


const productStorage = multer.diskStorage({
    destination: "public/images/product/original",
    filename: (req, file, cb) => {
        const filename = file.originalname;
        cb(null, filename)
    }
})

const productUpload = multer({ storage: productStorage });


const uploadProduct = productUpload.fields([
    { name: "imageFile1", maxCount: 1 },
    { name: "imageFile2", maxCount: 1 },
    { name: "imageFile3", maxCount: 1 },
    { name: "imageFile4", maxCount: 1 },
  ]);

  const userStorage = multer.diskStorage({

    destination: "public/images/user/orginal",
  
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