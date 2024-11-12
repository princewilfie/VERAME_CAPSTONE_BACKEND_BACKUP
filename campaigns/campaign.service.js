const db = require('_helpers/db'); // Adjust this path based on your project structure
const path = require('path');
const { Campaign } = require('./campaign.model'); // Ensure this path is correct
const sendEmail = require('_helpers/send-email');


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
    const campaign = await getById(id);
    campaign.Campaign_ApprovalStatus = 'Approved';
    campaign.Campaign_Status = 1;
    await campaign.save();

    // Send approval email with improved UI and content
    await sendEmail({
        to: campaign.account.acc_email,
        subject: ' Your JuanBayan Campaign is Approved!',
        text: `Your campaign "${campaign.Campaign_Name}" has been approved and is now live!`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                <h2 style="color: #4CAF50;">🎉 To our benefeciary, ${campaign.account.acc_firstname}!</h2>
                <p>Your campaign "<strong>${campaign.Campaign_Name}</strong>" has been approved and is now live on our platform!</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <h3>Campaign Details</h3>
                    <p><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</p>
                    <p><strong>Description:</strong> ${campaign.Campaign_Description}</p>
                    <p><strong>Target Fund:</strong> $${campaign.Campaign_TargetFund}</p>
                </div>
                <p style="margin-top: 20px;">
                    We’re thrilled to have your campaign on board! Feel free to share your campaign link with friends and supporters.
                </p>
                <p style="margin-top: 20px;">Best of luck,<br>The JuanBayan Team</p>
            </div>`
    });

    return campaign;
}


async function reject(id, adminNotes) {
    const campaign = await getById(id);
    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Update campaign details
    campaign.Campaign_ApprovalStatus = 'Rejected';
    campaign.Campaign_Status = 0;
    campaign.Admin_Notes = adminNotes; // Save admin notes for rejection reason

    // Save changes to the database
    await campaign.save();

    // Send rejection email with improved UI and content
    await sendEmail({
        to: campaign.account.acc_email,
        subject: 'Campaign Submission Update',
        text: `Unfortunately, your campaign "${campaign.Campaign_Name}" has not been approved.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                <h2 style="color: #FF6347;">Campaign Submission Update</h2>
                <p>Dear ${campaign.account.acc_firstname},</p>
                <p>We regret to inform you that your campaign "<strong>${campaign.Campaign_Name}</strong>" was not approved for publication on our platform.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <h3>Campaign Summary</h3>
                    <p><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</p>
                    <p><strong>Description:</strong> ${campaign.Campaign_Description}</p>
                </div>
                <p><strong>Admin Notes:</strong> ${adminNotes}</p> <!-- Display admin notes in the email -->
                <p style="margin-top: 20px;">
                    Please review our guidelines or contact support for additional information on why the campaign was not approved. We're here to help you succeed!
                </p>
                <p style="margin-top: 20px;">Best regards,<br>The JuanBayan Team</p>
            </div>`
    });

    return campaign;
}





function getCampaignStatus(campaign) {
    if (campaign.Campaign_Status === 3) {
        campaign.Campaign_ApprovalStatus = 'Done';
        campaign.Campaign_Status = 'Done';
    } else if (campaign.Campaign_Status === 1) {
        campaign.Campaign_ApprovalStatus = 'Approved';
        campaign.Campaign_Status = 'Active';
    } else if (campaign.Campaign_Status === 0) {
        campaign.Campaign_ApprovalStatus = 'Waiting For Approval';
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