const db = require('_helpers/db');
const path = require('path');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    redeem
};

async function create(params, file) {
    validateRewardParams(params);

    // Define a default image path if no file is uploaded
    const defaultImagePath = path.basename('default-reward.png'); // Only save the file name
    const imagePath = file ? path.basename(file.path) : defaultImagePath; // Save only the filename

    const reward = new db.Reward({
        ...params,
        reward_Image: imagePath // Add only the filename to the reward
    });

    updateRewardStatus(reward); // Set status based on quantity
    await reward.save();
    return reward;
}

async function update(id, params, file) {
    const reward = await getReward(id);
    validateRewardParams(params);

    if (file) {
        const newImagePath = path.basename(file.path); // Save only the filename if a new file is uploaded
        params.reward_Image = newImagePath; // Update with new filename
    }

    Object.assign(reward, params);
    updateRewardStatus(reward); // Set status based on quantity
    await reward.save();
    return reward;
} 

async function getAll() {
    return await db.Reward.findAll({
        where: {
            reward_Quantity: {
                [db.Op.gt]: 0  // Use db.Op here
            }
        }
    });
}

async function getById(id) {
    return await getReward(id);
}

async function _delete(id) {
    const reward = await getReward(id);
    await reward.destroy();
}

async function getReward(id) {
    const reward = await db.Reward.findByPk(id);
    if (!reward) throw 'Reward not found';
    return reward;
}

async function redeem(id, acc_id, address) {
    const account = await db.Account.findByPk(acc_id);
    if (!account) throw 'Account not found';

    const reward = await getReward(id);

    if (reward.reward_Quantity <= 0 || reward.reward_Status === 'Inactive') {
        throw 'Reward is not available for redemption';
    }

    // Reduce reward quantity
    reward.reward_Quantity -= 1;
    updateRewardStatus(reward);
    await reward.save();

    // Store redemption details in RedeemReward table
    const redemptionDate = new Date(); // Use current date as redemption date
    await db.RedeemReward.create({
        acc_id: acc_id,
        reward_ID: id,
        redeemReward_RedemptionDate: redemptionDate,
        redeemReward_address: address // Address can be passed as part of the redeem request
    });

    return reward;
}


function validateRewardParams(params) {
    if (params.reward_Quantity < 0) {
        throw 'Quantity cannot be negative';
    }
}

function updateRewardStatus(reward) {
    reward.reward_Status = reward.reward_Quantity > 0 ? 'Active' : 'Inactive';
}
