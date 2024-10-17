const db = require('_helpers/db');

module.exports = {
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal
};

// Request a full withdrawal for a campaign
async function requestWithdrawal(Campaign_ID, acc_id) {
    // Find the campaign by ID
    const campaign = await db.Campaign.findByPk(Campaign_ID);
    if (!campaign) throw 'Campaign not found';

    // Ensure there's money to withdraw
    if (campaign.Campaign_CurrentRaised <= 0) {
        throw 'No funds available for withdrawal';
    }

    // Create a new withdrawal request for the full amount
    const withdrawal = new db.Withdraw({
        Campaign_ID,
        acc_id,  // Set acc_id from the passed argument
        Withdraw_Amount: campaign.Campaign_CurrentRaised, // Withdraw the full amount
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
