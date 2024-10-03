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
    const defaultImagePath = path.join(__dirname, '../assets/default-reward.png');
    const imagePath = file ? file.path : defaultImagePath; // Set image path

    const reward = new db.Reward({
        ...params,
        reward_Image: imagePath // Add the image path to reward
    });

    updateRewardStatus(reward); // Set status based on quantity
    await reward.save();
    return reward;
}

async function update(id, params, file) {
    const reward = await getReward(id);
    validateRewardParams(params);

    if (file) {
        const newImagePath = file.path; // Update the image path if a new file is uploaded
        params.reward_Image = newImagePath;
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
                [db.Sequelize.Op.gt]: 0
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

async function redeem(id, acc_id) {
    const account = await db.Account.findByPk(acc_id);
    if (!account) throw 'Account not found';

    const reward = await getReward(id);
    
    if (reward.reward_Quantity <= 0 || reward.reward_Status === 'Inactive') {
        throw 'Reward is not available for redemption';
    }

    reward.reward_Quantity -= 1;
    reward.acc_id = acc_id;
    updateRewardStatus(reward);
    await reward.save();
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
