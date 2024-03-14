const User = require('../model/userModel')
const Address = require('../model/addressModel')

const addAddress = async (req, res) => {
    try {

        log("in address add")

        const user_id = req.session.user_id
        const userdata = {
            fullName: req.body.name,
            mobile: req.body.mobile,
            email: req.body.email,
            houseName: req.body.houseName,
            state: req.body.state,
            city: req.body.city,
            pin: req.body.pincode,
        }
        const address = await Address.findOneAndUpdate(
            { user: user_id }, { $set: { user: user_id }, $push: { address: userdata } }, { upsert: true, new: true }
        )

        console.log(address);

        res.json({addressAdded:true})
    } catch (e) {
        console.log('while adding address', e);
    }
}

module.exports = {
    addAddress
}