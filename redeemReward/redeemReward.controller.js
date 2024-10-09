const express = require('express');
const router = express.Router();
const redeemRewardService = require('./redeemReward.service');
const authorize = require('_middleware/authorize');

// POST route to redeem a reward
router.post('/', authorize(), redeemReward);

module.exports = router;

function redeemReward(req, res, next) {
    const rewardId = req.body.reward_id;
    const accountId = req.user.id; // Get from authenticated user session
    const address = req.body.address; // Address provided by the user

    if (!address) {
        return res.status(400).json({ message: 'Address is required' });
    }

    redeemRewardService.redeemReward(rewardId, accountId, address)
        .then(() => res.json({ message: 'Reward redeemed successfully' }))
        .catch(next);
}
