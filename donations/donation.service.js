const db = require('_helpers/db');
const axios = require('axios');
const apiKey = process.env.PAYMONGO_SECRET_KEY;
const encodedApiKey = Buffer.from(apiKey).toString('base64');

module.exports = {
    create,
    getAll,
    getById,
    createGcashPayment,
    getByCampaignId,
    handlePaymentSuccess,
    updateCampaignRaisedAmount,
};

// Create donation
async function create(req, res, next) {
    try {
        const { acc_id, campaign_id, donation_amount } = req.body;

        // Initiate the GCash payment
        const paymentData = await createGcashPayment({
            amount: donation_amount,
            campaignId: campaign_id,
            accId: acc_id,
            description: `Donation for campaign ID ${campaign_id}`,
            remarks: 'GCASH Donation',
        });

        // Return the payment link to the frontend for redirection
        res.status(201).json({ paymentLink: paymentData.checkout_url });
    } catch (error) {
        next(error);
    }
}

// Get all donations with account and campaign details
async function getAll() {
    try {
        const donations = await db.Donation.findAll({
            include: [
                {
                    model: db.Account,
                    as: 'account',
                    attributes: ['acc_firstname', 'acc_lastname', 'acc_email', 'acc_image']
                },
                {
                    model: db.Campaign,
                    as: 'campaign',
                    attributes: ['Campaign_Name']
                }
            ]
        });

        return donations.map(donation => detailedDonation(donation));
    } catch (error) {
        throw error;
    }
}

// Get donation by ID with account and campaign details
async function getById(id) {
    try {
        const donation = await db.Donation.findByPk(id, {
            include: [
                {
                    model: db.Account,
                    as: 'account',
                    attributes: ['acc_firstname', 'acc_lastname', 'acc_email', 'acc_image']
                },
                {
                    model: db.Campaign,
                    as: 'campaign',
                    attributes: ['Campaign_Name']
                }
            ]
        });
        if (!donation) throw 'Donation not found';

        return detailedDonation(donation);
    } catch (error) {
        throw error;
    }
}

// Update campaign raised amount
async function updateCampaignRaisedAmount(campaignId, amount, transaction) {
    try {
        const campaign = await db.Campaign.findByPk(campaignId, { transaction });
        if (!campaign) throw new Error('Campaign not found');

        campaign.Campaign_CurrentRaised += amount;
        await campaign.save({ transaction });
    } catch (error) {
        console.error('Error updating campaign raised amount:', error.message);
        throw error;
    }
}

// Basic donation details
function basicDetails(donation) {
    const { donation_id, acc_id, campaign_id, donation_amount, donation_date, status } = donation;
    return { donation_id, acc_id, campaign_id, donation_amount, donation_date, status };
}

// Detailed donation with virtual fields
function detailedDonation(donation) {
    return {
        donation_id: donation.donation_id,
        acc_id: donation.acc_id,
        campaign_id: donation.campaign_id,
        donation_amount: donation.donation_amount,
        donation_date: donation.donation_date,
        acc_firstname: donation.account ? donation.account.acc_firstname : null,
        acc_lastname: donation.account ? donation.account.acc_lastname : null,
        acc_email: donation.account ? donation.account.acc_email : null,
        acc_image: donation.account ? donation.account.acc_image : null, 
        Campaign_Name: donation.campaign ? donation.campaign.Campaign_Name : null
    };
}

// Create GCASH payment
async function createGcashPayment(paymentData) {
    console.log('Payment Data in createGcashPayment:', paymentData);
    handlePaymentSuccess(paymentData);

    try {
        const response = await axios.post(
            'https://api.paymongo.com/v1/links',
            {
                data: {
                    attributes: {
                        amount: paymentData.amount * 100,
                        description: paymentData.description,
                        remarks: paymentData.remarks,
                        reference_number: paymentData.accId,
                        metadata: {
                            campaignId: paymentData.campaignId,
                        }
                    }
                }
            },
            {
                headers: {
                    Authorization: `Basic ${encodedApiKey}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        return response.data.data.attributes;
    } catch (error) {
        console.error('Error in GCash payment initiation:', error.message);
        throw new Error('Payment initiation failed');
    }
}

// Handle payment success
// Handle payment success
async function handlePaymentSuccess(paymentData) {
    try {
        const { accId, campaignId, amount } = paymentData;
        const pointsEarned = Math.floor(amount / 100);

        // Calculate the amount after deducting 5%
        const amountAfterFee = amount * 0.95;

        // Create a new donation record
        const donation = await db.Donation.create({
            acc_id: accId,
            campaign_id: campaignId,
            donation_amount: amount,
            donation_date: new Date(),
        });

        const campaign = await db.Campaign.findByPk(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Update the campaign's current raised amount after fee deduction
        campaign.Campaign_CurrentRaised += amountAfterFee;
        await campaign.save();

        const account = await db.Account.findByPk(accId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Add points to the account based on the original donation amount
        account.acc_totalpoints += pointsEarned;
        await account.save();

        console.log(`Account ${account.acc_email} earned ${pointsEarned} points.`);

        return {
            message: 'Donation confirmed, campaign updated, and points added successfully',
            donation,
            pointsEarned
        };
    } catch (error) {
        console.error('Error confirming donation:', error.message);
        throw new Error('Error confirming donation or updating campaign: ' + error.message);
    }
}



// Fetch donations by campaign ID with account and campaign details
async function getByCampaignId(campaignId) {
    try {
        const donations = await db.Donation.findAll({
            where: { campaign_id: campaignId },
            include: [
                {
                    model: db.Account,
                    as: 'account',
                    attributes: ['acc_firstname', 'acc_lastname', 'acc_email', 'acc_image']
                },
                {
                    model: db.Campaign,
                    as: 'campaign',
                    attributes: ['Campaign_Name']
                }
            ]
        });

        return donations.map(donation => detailedDonation(donation));
    } catch (error) {
        throw error;
    }
}
