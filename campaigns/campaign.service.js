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
    handleDonation,
    getProofFiles,
    getNotes
};

async function create(params, campaignImage, proofFiles) {
    const defaultImagePath = path.basename('default-profile.png');
    const imagePath = campaignImage ? path.basename(campaignImage.path) : defaultImagePath;
    const proofImagePaths = proofFiles ? proofFiles.map(file => path.basename(file.path)) : [];

    const campaign = new db.Campaign({
        ...params,
        Campaign_Image: imagePath,
        Proof_Files: JSON.stringify(proofImagePaths),
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
    return await db.Campaign.findAll({
        include: [
            {
                model: db.Account,
                as: 'account',
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email']
            },
            {
                model: db.Category,
                as: 'category',
                attributes: ['Category_Name'] // Include only Category_Name
            }
        ]
    });
}


async function getById(id) {
    const campaign = await db.Campaign.findByPk(id, {
        include: [
            {
                model: db.Account,
                as: 'account',
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email']
            }
        ]
    });
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


async function handleDonation(campaignId, amount, transaction) {
    const campaign = await getCampaign(campaignId);
    if (!campaign) throw 'Campaign not found';

    // Calculate the amount after deducting the 5% fee
    const amountAfterFee = amount * 0.95;

    // Ensure the donation does not exceed the target fund
    const newRaisedAmount = campaign.Campaign_CurrentRaised - amountAfterFee;
    if (newRaisedAmount > campaign.Campaign_TargetFund) {
        throw 'Donation exceeds target fund';
    }

    // Update campaign's raised amount with the fee-deducted amount
    campaign.Campaign_CurrentRaised = newRaisedAmount;
    await campaign.save({ transaction });

    return campaign;
}

async function getProofFiles(campaignId) {
    // Fetch the campaign from the database
    const campaign = await db.Campaign.findByPk(campaignId);
    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Parse the proof files from the database (assuming it's stored as a JSON string)
    const proofFiles = JSON.parse(campaign.Proof_Files || '[]');
    return proofFiles;
}

async function getNotes(campaignId) {
    // Fetch campaign with specific attributes to ensure Campaign_Notes is returned
    const campaign = await db.Campaign.findByPk(campaignId, {
        attributes: ['Campaign_Notes'], // Check that this attribute exists in the model
    });

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    console.log('Fetched notes:', campaign.Campaign_Notes); // Debug log to verify data
    return campaign.Campaign_Notes;
}