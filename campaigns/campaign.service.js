const db = require('_helpers/db');
const path = require('path');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    approve,
    reject,
    getByAccountId
};

async function create(params, campaignImage, proofFiles) {
    const defaultImagePath = path.join(__dirname, '../assets/default-profile.png');
    const imagePath = campaignImage ? campaignImage.path : defaultImagePath;

    // Create a new campaign with campaign image and proof files
    const campaign = new db.Campaign({
        ...params,
        Campaign_Image: imagePath,
        Proof_Files: JSON.stringify(proofFiles), // Store proof files as JSON
        Campaign_ApprovalStatus: 'Waiting For Approval'
    });

    await campaign.save();
    return campaign;
}

async function update(id, params, campaignImage, proofFiles) {
    const campaign = await getById(id);

    if (campaignImage) {
        params.Campaign_Image = campaignImage.path;
    }

    if (proofFiles.length > 0) {
        params.Proof_Files = JSON.stringify(proofFiles); // Update proof files
    }

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

async function getByAccountId(accountId) {
    return await db.Campaign.findAll({ where: { Acc_ID: accountId } });
}
