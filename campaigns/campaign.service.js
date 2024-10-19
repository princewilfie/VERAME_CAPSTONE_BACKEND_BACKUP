const db = require('_helpers/db'); // Adjust this path based on your project structure
const path = require('path');
const { Campaign } = require('./campaign.model'); // Ensure this path is correct

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    approve,
    reject,
    getByAccountId,
    getCampaignStatus,
    handleDonation
};

async function create(params, campaignImage, proofFiles) {
    const defaultImagePath = path.basename('default-profile.png'); // Default image

    // If campaignImage is provided, use its path, otherwise use default
    const imagePath = campaignImage ? path.basename(campaignImage.path) : defaultImagePath;

    // Create new campaign with image and proof files
    const campaign = new db.Campaign({
        ...params,
        Campaign_Image: imagePath,
        Proof_Files: JSON.stringify(proofFiles), // Convert proof files array to JSON string
        Campaign_ApprovalStatus: 'Waiting For Approval',
    });

    await campaign.save();
    return campaign;
}

async function update(id, params, campaignImage, proofFiles) {
    const campaign = await getCampaign(id);

    // If a new campaign image is provided, update the image path
    if (campaignImage) {
        const newImagePath = path.basename(campaignImage.path);
        params.Campaign_Image = newImagePath;
    }

    // If proof files are provided, update them
    if (proofFiles) {
        params.Proof_Files = JSON.stringify(proofFiles);
    }

    // Ensure Campaign_Status is a number
    if (params.Campaign_Status !== undefined) {
        params.Campaign_Status = Number(params.Campaign_Status); // Convert string to number if necessary
    }

    // Merge new params into the existing campaign
    Object.assign(campaign, params);

    // Update the campaign status logic
    getCampaignStatus(campaign);

    await campaign.save();
    return campaign;
}



// For Admin
async function approve(id) {
    const campaign = await getById(id); // Fetch campaign by ID
    campaign.Campaign_ApprovalStatus = 'Approved';
    campaign.Campaign_Status = 1; // Set status to 'Active'
    await campaign.save();
    return campaign;
}

async function reject(id) {
    const campaign = await getById(id); // Fetch campaign by ID
    campaign.Campaign_ApprovalStatus = 'Rejected';
    campaign.Campaign_Status = 0; // Set status to 'Inactive'
    await campaign.save();
    return campaign;
}

function getCampaignStatus(campaign) {
    if (campaign.Campaign_Status === 1) {
        campaign.Campaign_ApprovalStatus = 'Approved';
        campaign.Campaign_Status = 'Active';
    } else if (campaign.Campaign_Status === 0) {
        campaign.Campaign_ApprovalStatus = 'Waiting For Approval'; // Change to 'Inactive' instead of 'Rejected'
        campaign.Campaign_Status = 'Inactive';
    } else if (campaign.Campaign_Status === 2) {
        campaign.Campaign_ApprovalStatus = 'Rejected';
        campaign.Campaign_Status = 'Inactive';
    }
    return campaign;
}




async function getCampaign(id) {
    // Fetch the campaign from the database by ID
    const campaign = await db.Campaign.findByPk(id); // Adjust this to your model setup

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    return campaign;
}

async function getAll() {
    return await db.Campaign.findAll(); // Fetch all campaigns
}

async function getById(id) {
    const campaign = await db.Campaign.findByPk(id); // Fetch campaign by ID
    if (!campaign) throw 'Campaign not found';
    return campaign;
}

async function _delete(id) {
    const campaign = await getById(id); // Fetch campaign by ID
    await campaign.destroy(); // Delete campaign
}

async function getByAccountId(accountId) {
    return await db.Campaign.findAll({ where: { Acc_ID: accountId } }); // Fetch campaigns by account ID
}


async function handleDonation(campaignId, amount) {
    const campaign = await getCampaign(campaignId);
    if (!campaign) throw 'Campaign not found';

    // Ensure the donation does not exceed the target fund
    const newRaisedAmount = campaign.Campaign_CurrentRaised + amount;
    if (newRaisedAmount > campaign.Campaign_TargetFund) {
        throw 'Donation exceeds target fund';
    }

    // Update campaign's raised amount
    campaign.Campaign_CurrentRaised = newRaisedAmount;
    await campaign.save();

    return campaign;
}