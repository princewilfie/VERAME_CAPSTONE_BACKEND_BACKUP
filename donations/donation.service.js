const db = require('_helpers/db');
const axios = require('axios');
const apiKey = process.env.PAYMONGO_SECRET_KEY;  // Load from environment
const encodedApiKey = Buffer.from(apiKey).toString('base64');  // Base64 encode it

module.exports = {
    create,
    getAll,
    getById,
    createGcashPayment,
    handlePaymentSuccess,
    updateCampaignRaisedAmount,
};

// Create donation
async function create(req, res, next) {
    try {
        const { acc_id, campaign_id, donation_amount } = req.body;

        // Initiate the GCash payment
        const paymentData = await donationService.createGcashPayment({
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


// Get all donations
async function getAll() {
    try {
        const donations = await db.Donation.findAll();
        return donations.map(donation => basicDetails(donation));
    } catch (error) {
        throw error;
    }
}

// Get donation by ID
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

// Update campaign raised amount
async function updateCampaignRaisedAmount(campaignId, amount, transaction) {
    try {
        const campaign = await db.Campaign.findByPk(campaignId, { transaction });
        if (!campaign) throw new Error('Campaign not found');

        campaign.Campaign_CurrentRaised += amount;
        await campaign.save({ transaction });  // Ensure the campaign is saved within the transaction
    } catch (error) {
        console.error('Error updating campaign raised amount:', error.message);
        throw error;
    }
}

// Basic donation details
function basicDetails(donation) {
    const { donation_id, acc_id, campaign_id, donation_amount, donation_date } = donation;
    return { donation_id, acc_id, campaign_id, donation_amount, donation_date };
}


// Create GCASH payment
async function createGcashPayment(paymentData) {

    console.log('Payment Data in createGcashPayment:', paymentData);

    // Initiate the GCash payment
    handlePaymentSuccess(paymentData);

    try {
        const response = await axios.post(
            'https://api.paymongo.com/v1/links',  // Correct endpoint
            {
                data: {
                    attributes: {
                        amount: paymentData.amount * 100,  // Amount in cents
                        description: paymentData.description,
                        remarks: paymentData.remarks,
                        reference_number: paymentData.accId,  // Reference number field for GCash/PayMongo
                        metadata: {
                            campaignId: paymentData.campaignId,
                        }
                    }
                }
            },
            {
                headers: {
                    Authorization: `Basic ${encodedApiKey}`,  // Correct API key
                    'Content-Type': 'application/json',
                }
            }
        );

        return response.data.data.attributes;  // Return payment data
        
    } catch (error) {
        console.error('Error in GCash payment initiation:', error.message);
        throw new Error('Payment initiation failed');
    }
}



// Handle payment success (ensure this function is called when webhook event is received)
async function handlePaymentSuccess(paymentData) {
    try {
        const { accId, campaignId, amount } = paymentData;

        console.log('Payment Data in handlePaymentSuccess:', paymentData);

        const pointsEarned = Math.floor(amount / 100);  // Adjust the divisor for the conversion rate you want

        // Create the donation in the database
        const donation = await db.Donation.create({
            acc_id: accId,
            campaign_id: campaignId,
            donation_amount: amount,
            donation_date: new Date(),
            status: 'confirmed' // Assuming you have a status field for donations
        });

        console.log('Donation confirmed:', donation);

        // Fetch the associated campaign
        const campaign = await db.Campaign.findByPk(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        // Update the campaign's current raised amount
        campaign.Campaign_CurrentRaised += amount;
        await campaign.save();

        console.log('Campaign updated successfully:', campaign);

        // Fetch the account and update their total points
        const account = await db.Account.findByPk(accId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Add points to acc_totalpoints
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