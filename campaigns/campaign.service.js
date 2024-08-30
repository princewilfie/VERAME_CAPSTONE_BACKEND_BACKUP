const db = require('_helpers/db');
const path = require('path');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    approve,
    reject
};

async function create(params, file) {
    // Define a default image path if no file is uploaded
    const defaultImagePath = path.join(__dirname, '../assets/default-profile.png');

    // Use the file path provided by multer if a file is uploaded, otherwise use the default image
    const imagePath = file ? file.path : defaultImagePath;

    // Create a new campaign instance with the provided parameters
    const campaign = new db.Campaign({
        ...params,
        Campaign_Image: imagePath,
        Campaign_ApprovalStatus: 'Waiting For Approval' // Set status to Pending on creation
    });

    // Save the campaign to the database
    await campaign.save();

    return campaign;
}

async function update(id, params, file) {
    const campaign = await getById(id);

    // Update image if a new file is uploaded
    if (file) {
        // Optionally, delete the old image file here if needed
        const newImagePath = file.path;
        params.Campaign_Image = newImagePath;
    }

    // Update campaign with new parameters
    Object.assign(campaign, params);

    await campaign.save();

    return campaign;
}

async function approve(id) {
    const campaign = await getById(id);
    campaign.Campaign_ApprovalStatus = 'Approved';
    await campaign.save();
    return campaign;
}

async function reject(id) {
    const campaign = await getById(id);
    campaign.Campaign_ApprovalStatus = 'Rejected';
    await campaign.save();
    return campaign;
}

async function getAll() {
    return await db.Campaign.findAll();
}

async function getById(id) {
    const campaign = await db.Campaign.findByPk(id);
    if (!campaign) throw 'Campaign not found';
    return campaign;
}

async function _delete(id) {
    const campaign = await getById(id);
    await campaign.destroy();
}
