const db = require('_helpers/db');
const sendEmail = require('_helpers/send-email');
const { required } = require('joi');

module.exports = {
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    getAll,
    submitTestimony,
    getWithdrawByCampaignId
};

// Request a full withdrawal for a campaign
async function requestWithdrawal(Campaign_ID, acc_id, Acc_number, Bank_account) {
    // Find the campaign by ID
    const campaign = await db.Campaign.findByPk(Campaign_ID);
    if (!campaign) throw 'Campaign not found';

    // Ensure there's money to withdraw
    if (campaign.Campaign_CurrentRaised <= 0) {
        throw 'No funds available for withdrawal';
    }

    // Create a new withdrawal request
    const withdrawal = new db.Withdraw({
        Campaign_ID,
        acc_id,
        Acc_number,  // Set Acc_number from the passed argument
        Bank_account,  // Set Bank_account from the passed argument
        Withdraw_Amount: campaign.Campaign_CurrentRaised,
        Status: 'Pending',
    });

    campaign.Withdrawal_Status = 'Pending';
    await campaign.save();

    await withdrawal.save();
    return withdrawal;
}

// Approve the withdrawal (admin only)
async function approveWithdrawal(id) {
    const withdrawal = await db.Withdraw.findByPk(id);
    if (!withdrawal) throw 'Withdrawal request not found';

    // Check if the campaign associated with this withdrawal has remaining funds
    const campaign = await db.Campaign.findByPk(withdrawal.Campaign_ID);
    if (!campaign) throw 'Campaign not found';

    // Prevent approval if there are no funds left to withdraw
    if (campaign.Campaign_CurrentRaised <= 0) {
        throw ('Cannot approve withdrawal. No funds available for this campaign.');
    }

    withdrawal.Status = 'Approved';
    await withdrawal.save();

    // Deduct the full amount from the campaign's raised funds
    campaign.Campaign_CurrentRaised = 0; // Set to zero after withdrawal

    campaign.Campaign_ApprovalStatus = 'Done';

    campaign.Campaign_Status = 3; // Set campaign status to "Done"


    campaign.Withdrawal_Status = 'Done';

    await campaign.save();

    // Fetch the user's account to get email information
    const account = await db.Account.findByPk(withdrawal.acc_id); 
    if (!account) throw 'Account not found';

    // Prepare email options
    const emailOptions = {
        to: account.acc_email,
        subject: 'Your Withdrawal Request for Campaign: Approved!',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #5b9bd5;">Withdrawal Request Approved</h2>
                <p>Dear ${account.acc_firstname} ${account.acc_lastname},</p>
                <p>We're pleased to inform you that your withdrawal request has been <strong>approved</strong> for the campaign <strong>${campaign.Campaign_Name}</strong>.</p>
                
                <h4 style="color: #5b9bd5;">Campaign Details:</h4>
                <ul style="line-height: 1.6;">
                    <li><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</li>
                    <li><strong>Description:</strong> ${campaign.Campaign_Description}</li>
                    <li><strong>Amount Withdrawn:</strong> ${withdrawal.Withdraw_Amount.toLocaleString()} ${withdrawal.currency || 'PHP'}</li>
                    <li><strong>Bank Account:</strong> ${withdrawal.Bank_account}</li>
                </ul>
                
                <p>The funds should be credited to your account within <strong>24 hours</strong>. Please note that processing times may vary depending on your bank or financial institution.</p>
                
                <h4 style="color: #5b9bd5;">Next Steps:</h4>
                <p>You are now able to submit a testimony about your experience with the campaign and how JuanBayan helped you. Please log into your account to submit your testimony.</p>
                <p>We encourage you to log into your account to review the withdrawal details and monitor your campaign progress.</p>
                
                <p style="margin-top: 30px;">Thank you for being a valued member of our platform.</p>
                
                <hr style="border: none; border-top: 1px solid #ccc;">
                <p style="font-size: 12px; color: #888;">If you have any questions, feel free to contact us at <a href="mailto:support@yourplatform.com">support@yourplatform.com</a>.</p>
                <p style="font-size: 12px; color: #888;">JuanBayan, 123 Main Street, City, Philippines</p>
            </div>
        `
    };
    
    // Send email notification
    await sendEmail(emailOptions);
    
    return withdrawal;
}

// Reject the withdrawal (admin only)
async function rejectWithdrawal(id) {
    const withdrawal = await db.Withdraw.findByPk(id);
    if (!withdrawal) throw 'Withdrawal request not found';

    // Fetch the campaign details
    const campaign = await db.Campaign.findByPk(withdrawal.Campaign_ID);
    if (!campaign) throw 'Campaign not found';

    // Update withdrawal and campaign status to Rejected
    withdrawal.Status = 'Rejected';
    await withdrawal.save();

    campaign.Withdrawal_Status = 'Rejected'; // Set campaign's withdrawal status to Rejected
    await campaign.save();

    // Fetch the user's account to get email information
    const account = await db.Account.findByPk(withdrawal.acc_id);
    if (!account) throw 'Account not found';

    // Prepare email options
    const emailOptions = {
        to: account.acc_email,
        subject: 'Your Withdrawal Request for Campaign: Rejected',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #e74c3c;">Withdrawal Request Rejected</h2>
                <p>Dear ${account.acc_firstname} ${account.acc_lastname},</p>
                <p>We regret to inform you that your withdrawal request for the campaign <strong>${campaign.Campaign_Name}</strong> has been <strong>rejected</strong>.</p>
                
                <h4 style="color: #e74c3c;">Reason for Rejection:</h4>
                <p>Please contact our support team at <a href="mailto:juanbayan.ph@gmail.com">juanbayan.ph@gmail.com</a> for further details.</p>
                
                <h4 style="color: #5b9bd5;">Campaign Details:</h4>
                <ul style="line-height: 1.6;">
                    <li><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</li>
                    <li><strong>Description:</strong> ${campaign.Campaign_Description}</li>
                    <li><strong>Requested Amount:</strong> ${withdrawal.Withdraw_Amount.toLocaleString()} ${withdrawal.currency || 'PHP'}</li>
                    <li><strong>Bank Account:</strong> ${withdrawal.Bank_account}</li>
                </ul>
                
                <p style="margin-top: 30px;">We apologize for any inconvenience caused and appreciate your understanding.</p>
                
                <hr style="border: none; border-top: 1px solid #ccc;">
                <p style="font-size: 12px; color: #888;">If you have any questions, feel free to contact us at <a href="mailto:juanbayan.ph@gmail.com">juanbayan.ph@gmail.com</a>.</p>
                <p style="font-size: 12px; color: #888;">JuanBayan, 123 Main Street, City, Philippines</p>
            </div>
        `
    };

    // Send email notification
    await sendEmail(emailOptions);

    return withdrawal;
}



// Get all withdrawal requests with associated account and campaign details
async function getAll() {
    return await db.Withdraw.findAll({
        include: [
            {
                model: db.Account,
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email' , 'acc_image'],
            },
            {
                model: db.Campaign,
                attributes: ['Campaign_Name', 'Campaign_Description'] 
            }
        ]
    });
}


async function submitTestimony(Withdraw_ID, testimony) {
    // Find the withdrawal, including the associated Account
    const withdrawal = await db.Withdraw.findByPk(Withdraw_ID, {
        include: [
            {
                model: db.Account,
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email', 'acc_image'], 
                required: true 
            }
        ]
    });

    if (!withdrawal) throw 'Withdrawal not found';

    // Check if the withdrawal has already been approved
    if (withdrawal.Status !== 'Approved') {
        throw 'Testimony can only be submitted for approved withdrawals';
    }

    // Update the testimony field
    withdrawal.Testimony = testimony;
    await withdrawal.save();

    // Return the withdrawal with the account details
    return withdrawal;
}

async function getWithdrawByCampaignId(campaignId) {
    // Fetch all withdrawals that are associated with the given Campaign_ID
    const withdrawals = await db.Withdraw.findAll({
        where: { Campaign_ID: campaignId },
        include: [
            {
                model: db.Account,
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email', 'acc_image'], 
                required: true 
            },
            {
                model: db.Campaign,
                attributes: ['Campaign_Name', 'Campaign_Description']
            }
        ]
    });

    if (withdrawals.length === 0) {
        throw 'No withdrawals found for this campaign';
    }

    return withdrawals; 
}