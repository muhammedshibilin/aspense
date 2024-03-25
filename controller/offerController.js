const Offer = require ('../model/offerModel')

const offerLoad = async (req,res) => {
    try {
        const offerData = await Offer.find()
       res.render("offer",{offerData}) 
    } catch (e) {
        console.log('while loading offer' ,e);
    }
}

const addOfferLoad = async(req,res) => {
    try{

         res.render('addOffer')
    }catch(e){
      console.log('while loading adding offer',e);
    }
} 

const addOffer = async (req,res)=>{
    try {
         console.log('bofyyyy',req.body);
        const data = new Offer({
            name:req.body.name,
            discountAmount:req.body.offerAmount,
            startDate:req.body.activeDate,
            endDate:req.body.expireDate,
        })

       const offerData =  await data.save()
       res.json({success:true})

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
}

const editOfferLoad = async (req,res)=>{
    try {
       
        const offerId = req.query._id;
        console.log('id',offerId);
        const offerData = await Offer.findById(offerId)
        res.render("editOffer",{offer:offerData})

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
}

const editOffer = async (req,res)=>{
    try {
         console.log('boduyyyyyyy',req.body);
        const offerId = req.body.offerId
        console.log('start',);
        console.log('id',offerId);
      

        await Offer.findOneAndUpdate({_id:offerId},
            {
                name:req.body.name,
                discountAmount:req.body.offerAmount,
                startDate:req.body.activeDate,
                endDate:req.body.expireDate,
            })

     res.json({success:true})

    } catch (error) {
        console.log(error,"while editing offer");
        res.render('500')
    }
}



const blockOffer = async (req,res)=>{
    try {

        const offerId = req.body.offerId
        console.log('ajf',offerId);
        const offerData = await Offer .findById(offerId)

        if(offerData.is_block==0){
            await Offer.findOneAndUpdate({_id:offerId},{$set:{is_block:1}})
        }else{
            await Offer.findOneAndUpdate({_id:offerId},{$set:{is_block:0}})
        }
        res.json({block:true})

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
}

const deleteOffer = async (req,res)=>{
    try {

        const offerId = req.body.offerId
        console.log('fahjdg',offerId);
        await Offer.findOneAndDelete({_id:offerId})
        res.json({delete:true})
        
    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
}

module.exports = {
    offerLoad,
    addOfferLoad,
    addOffer,
    editOfferLoad,
    editOffer,
    blockOffer,
    deleteOffer
}


