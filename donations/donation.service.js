const db = require('_helpers/db');

module.exports = {
    create,
    getAll,
    getById
};

async function create(donationData) {
    try {
        // Check if the account exists
        const account = await db.Account.findByPk(donationData.acc_id);
        if (!account) {
            throw new Error('Account with this acc_id does not exist');
        }

        // Check if the campaign exists
        const campaign = await db.Campaign.findByPk(donationData.campaign_id);
        if (!campaign) {
            console.error(`Campaign not found: campaign_id=${donationData.campaign_id}`);
            throw new Error('Campaign with this campaign_id does not exist');
        }

        // Check if the donation exceeds the campaign's target fund
        const newRaisedAmount = campaign.Campaign_CurrentRaised + donationData.donation_amount;
        if (newRaisedAmount > campaign.Campaign_TargetFund) {
            throw new Error('Donation amount exceeds the campaign\'s target fund');
        }

        // Proceed to create the donation
        const donation = await db.Donation.create(donationData);

        // Update the campaign's raised amount
        await updateCampaignRaisedAmount(campaign.Campaign_ID, newRaisedAmount);

        return basicDetails(donation);
    } catch (error) {
        console.error('Error in donation creation:', error.message);
        throw error;
    }
}



async function getAll() {
    try {
        const donations = await db.Donation.findAll();
        return donations.map(donation => basicDetails(donation));
    } catch (error) {
        throw error;
    }
}

async function getById(id) {
    try {
        const donation = await getDonation(id);
        return basicDetails(donation);
    } catch (error) {
        throw error;
    }
}

async function getDonation(id) {
    try {
        const donation = await db.Donation.findByPk(id);
        if (!donation) throw 'Donation not found';
        return donation;
    } catch (error) {
        throw error;
    }
}

async function updateCampaignRaisedAmount(campaignId, newRaisedAmount) {
    try {
        // Find the campaign by ID
        const campaign = await db.Campaign.findByPk(campaignId);
        if (!campaign) throw new Error('Campaign not found');

        // Update the Campaign_CurrentRaised field
        campaign.Campaign_CurrentRaised = newRaisedAmount;
        await campaign.save();
    } catch (error) {
        console.error('Error updating campaign raised amount:', error.message);
        throw error;
    }
}





function basicDetails(donation) {
    const { donation_id, acc_id, campaign_id, donation_amount, donation_date } = donation;
    return { donation_id, acc_id, campaign_id, donation_amount, donation_date };
}
