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
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]);

module.exports ={
    uploadProduct
}