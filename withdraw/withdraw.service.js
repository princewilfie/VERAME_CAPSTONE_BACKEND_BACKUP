const db = require('_helpers/db');
const sendEmail = require('_helpers/send-email');


module.exports = {
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal
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
        Status: 'Pending'
    });

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
    await campaign.save();

    // Fetch the user's account to get email information
    const account = await db.Account.findByPk(withdrawal.acc_id); 
    if (!account) throw 'Account not found';

    // Prepare email options
    const emailOptions = {
        to: account.acc_email,
        subject: 'Withdrawal Request Approved',
        html: `
            <p>Dear ${account.acc_firstname},</p>
            <p>Your withdrawal request for the campaign <strong>${campaign.Campaign_Name}</strong> has been approved.</p>
            <p>Campaign Description: ${campaign.Campaign_Description}</p>
            <p>Amount Withdrawn: ${withdrawal.Withdraw_Amount}</p>
            <p>Bank Account: ${withdrawal.Bank_account}</p>
            <p>Thank you for using our platform!</p>
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

    withdrawal.Status = 'Rejected';
    await withdrawal.save();

    return withdrawal;
}
