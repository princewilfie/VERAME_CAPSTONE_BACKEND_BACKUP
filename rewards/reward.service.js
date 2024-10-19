const db = require('_helpers/db');
const path = require('path');
const sendEmail = require('_helpers/send-email');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    redeem,
    getAllForAdmin
};


async function create(params, file) {
    validateRewardParams(params);

    // Define a default image path if no file is uploaded
    const defaultImagePath = path.basename('assets/default-reward.png'); // Only save the file name
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

async function getAllForAdmin() {
    // Return all rewards for admin users
    return await db.Reward.findAll();
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

function validateRewardParams(params) {
    if (params.reward_Quantity < 0) {
        throw 'Quantity cannot be negative';
    }
}

function updateRewardStatus(reward) {
    reward.reward_Status = reward.reward_Quantity > 0 ? 'Active' : 'Inactive';
}

async function redeem(id, acc_id, address) {
    const account = await db.Account.findByPk(acc_id);
    if (!account) throw 'Account not found';

    const reward = await getReward(id);

    // Check if the account has enough points for the reward
    if (account.acc_totalpoints < reward.reward_PointCost) {
        throw 'Insufficient points to redeem the reward';
    }

    if (reward.reward_Quantity <= 0 || reward.reward_Status === 'Inactive') {
        throw 'Reward is not available for redemption';
    }

    // Deduct points from account first
    account.acc_totalpoints -= reward.reward_PointCost; 
    await account.save(); // Save the updated account points

    // Reduce reward quantity
    reward.reward_Quantity -= 1;
    updateRewardStatus(reward);
    await reward.save();

    // Store redemption details in RedeemReward table
    const redemptionDate = new Date();
    await db.RedeemReward.create({
        acc_id: acc_id,
        reward_ID: id,
        redeemReward_RedemptionDate: redemptionDate,
        redeemReward_address: address
    });

    // Optionally send an email notification (if needed)
    const emailOptions = {
        to: account.acc_email,
        subject: 'Reward Redeemed Successfully',
        html: `
            <p>Dear ${account.acc_firstname},</p>
            <p>You have successfully redeemed the reward: ${reward.reward_Name}.</p>
            <p>Delivery Address: ${address}</p>
            <p>Thank you for using our service!</p>
        `
    };

    await sendEmail(emailOptions);

    return reward;
}


