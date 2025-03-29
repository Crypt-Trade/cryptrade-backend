const User = require('../models/User');


async function handleGetAllReferrals(req, res) {
    try {
        const { sponsorId } = req.body;
        if(!sponsorId) { return res.status(404).json({ message: "Please provide sponsor ID." }); }

        // Find the sponsor
        const user = await User.findOne({mySponsorId: sponsorId});
        if (!user) { return res.status(404).json({ message: 'User not found' }); }

        // Find all referrals
        const referrals = await User.find({ sponsorId: user.mySponsorId });
        return res.status(200).json(referrals);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}
module.exports = {
    handleGetAllReferrals 
}