const db = require('_helpers/db');
const path = require('path');
const fs = require('fs');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete
};

async function create(params, files) {
    // Save files to disk
    const imagePath = files && files.image ? saveFile(files.image) : null;

    const campaign = new db.Campaign(params);
    campaign.Campaign_Image = imagePath; // Assuming you have an image field

    await campaign.save();

    return campaign;
}

function saveFile(file) {
    const filePath = path.join(__dirname, '../assets/', file.filename);
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
}

async function getAll() {
    return await db.Campaign.findAll();
}

async function getById(id) {
    const campaign = await db.Campaign.findByPk(id);
    if (!campaign) throw 'Campaign not found';
    return campaign;
}

async function update(id, params) {
    const campaign = await getById(id);
    Object.assign(campaign, params);
    await campaign.save();
    return campaign;
}

async function _delete(id) {
    const campaign = await getById(id);
    await campaign.destroy();
}
