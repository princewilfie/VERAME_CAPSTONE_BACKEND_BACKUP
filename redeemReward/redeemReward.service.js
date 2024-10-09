const db = require('_helpers/db');

module.exports = {
    redeemReward
};

async function redeemReward(rewardId, accId, address) {
    const account = await db.Account.findByPk(accId);
    if (!account) throw 'Account not found';

    const reward = await db.Reward.findByPk(rewardId);
    if (!reward) throw 'Reward not found';

    if (reward.reward_Quantity <= 0 || reward.reward_Status === 'Inactive') {
        throw 'Reward is not available for redemption';
    }

    // Reduce reward quantity
    reward.reward_Quantity -= 1;
    await reward.save();

    // Save the redeem reward entry
    const redeemReward = new db.RedeemReward({
        acc_id: accId,
        reward_id: rewardId,
        redeemReward_address: address
    });

    await redeemReward.save();
    return redeemReward;
}
