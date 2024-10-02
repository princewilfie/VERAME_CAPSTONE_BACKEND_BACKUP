const db = require('_helpers/db');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    consume
};

async function create(params) {
    // Create a new reward instance and save it to the database
    const reward = new db.Reward(params);
    await reward.save();
    return reward;
}

async function getAll() {
    // Fetch all rewards from the database
    return await db.Reward.findAll();
}

async function getById(id) {
    // Fetch reward by its ID
    return await getReward(id);
}

async function update(id, params) {
    // Fetch the reward by ID and update it with new values
    const reward = await getReward(id);
    Object.assign(reward, params);
    await reward.save();
    return reward;
}

async function _delete(id) {
    // Fetch the reward by ID and delete it
    const reward = await getReward(id);
    await reward.destroy();
}

async function getReward(id) {
    const reward = await db.Reward.findByPk(id);
    if (!reward) throw 'Reward not found';
    return reward;
}
async function consume(id) {
    // Fetch the reward by ID
    const reward = await getReward(id);
    // Update its status to 'Inactive'
    reward.reward_Status = 'Inactive';
    await reward.save();
}
