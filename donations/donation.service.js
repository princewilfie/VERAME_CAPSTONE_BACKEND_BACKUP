const db = require('_helpers/db');
const axios = require('axios');
const apiKey = process.env.PAYMONGO_SECRET_KEY;
const encodedApiKey = Buffer.from(apiKey).toString('base64');
const sendEmail = require('_helpers/send-email');

module.exports = {
    create,
    getAll,
    getById,
    createGcashPayment,
    getByCampaignId,
    handlePaymentSuccess,
    updateCampaignRaisedAmount,
    getFeeAmounts
    
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
        fee_amount: donation.fee_amount,
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

        // Calculate the fee based on the amount threshold
        const feePercentage = amount < 1000 ? 0.03 : 0.05;
        const feeAmount = amount * feePercentage;
        const amountAfterFee = amount - feeAmount;
        const donationDate = new Date().toLocaleDateString(); // Format donation date

        // Create a new donation record
        const donation = await db.Donation.create({
            acc_id: accId,
            campaign_id: campaignId,
            donation_amount: amount,
            fee_amount: feeAmount,  
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

        // Flag donation if amount >= 500,000 PHP
        if (amount >= 500000) {
            // Send an email to both the donor and ICC (juanbayan.ph@gmail.com) if the donation is large
            const adminEmailOptions = {
                to: 'juanbayan.ph@gmail.com',
                subject: `High Donation Alert: ${campaign.Campaign_Name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #ff6347;">High Donation Alert</h2>
                        <p>Dear JuanBayan Admin,</p>
                        <p>A large donation of <strong>${amount.toLocaleString()} PHP</strong> has been made to the campaign <strong>${campaign.Campaign_Name}</strong>.</p>
                        <h4 style="color: #5b9bd5;">Donation Details:</h4>
                        <ul style="line-height: 1.6;">
                            <li><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</li>
                            <li><strong>Amount Donated:</strong> ${amount.toLocaleString()} PHP</li>
                            <li><strong>Fee Percentage:</strong> ${(feePercentage * 100).toFixed(1)}%</li>
                            <li><strong>Amount Credited to Campaign:</strong> ${amountAfterFee.toLocaleString()} PHP</li>
                            <li><strong>Points Earned:</strong> ${pointsEarned}</li>
                            <li><strong>Donation Date:</strong> ${donationDate}</li>
                        </ul>
                        <p>This donation has been flagged due to the high amount.</p>
                        <hr style="border: none; border-top: 1px solid #ccc;">
                        <p style="font-size: 12px; color: #888;">JuanBayan, 123 Main Street, City, Philippines</p>
                    </div>
                `
            };

            // Send the alert email to the ICC (juanbayan.ph@gmail.com)
            await sendEmail(adminEmailOptions);

            // Send the email to the donor
            const donorEmailOptions = {
                to: account.acc_email,
                subject: `Donation Flagged for Campaign: ${campaign.Campaign_Name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #ff6347;">Donation Flagged</h2>
                        <p>Dear ${account.acc_firstname} ${account.acc_lastname},</p>
                        <p>We would like to inform you that your donation of <strong>${amount.toLocaleString()} PHP</strong> to the campaign <strong>${campaign.Campaign_Name}</strong> has been flagged due to the large amount donated.</p>
                        
                        <p>This action is in compliance with the Anti-Money Laundering Act (AMLA) of the Philippines, which requires organizations to perform additional verification for large transactions.</p>
            
                        <h4 style="color: #5b9bd5;">Donation Details:</h4>
                        <ul style="line-height: 1.6;">
                            <li><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</li>
                            <li><strong>Description:</strong> ${campaign.Campaign_Description}</li>
                            <li><strong>Amount Donated:</strong> ${amount.toLocaleString()} PHP</li>
                            <li><strong>Fee Percentage:</strong> ${(feePercentage * 100).toFixed(1)}%</li>
                            <li><strong>Amount Credited to Campaign:</strong> ${amountAfterFee.toLocaleString()} PHP</li>
                            <li><strong>Points Earned:</strong> ${pointsEarned}</li>
                            <li><strong>Donation Date:</strong> ${donationDate}</li>
                        </ul>
                        
                        <p>As part of the AMLA compliance, we kindly request that you submit valid identification (IDs) for verification. Please attach the following documents and send them to the email address below:</p>
                        <ul style="line-height: 1.6;">
                            <li>Valid Government-issued ID (e.g., Passport, Driver's License, SSS ID, or other official ID)</li>
                            <li>Proof of Billing (e.g., utility bill or bank statement, if applicable)</li>
                        </ul>
                        <p>Please email the documents to <a href="mailto:juanbayan.support@gmail.com">juanbayan.support@gmail.com</a>.</p>

            
                        <p>Your donation has been flagged for further review while we process these requirements. We appreciate your understanding and cooperation.</p>
            
                        <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:juanbayan.ph@gmail.com">juanbayan.ph@gmail.com</a>.</p>
            
                        <hr style="border: none; border-top: 1px solid #ccc;">
                        <p style="font-size: 12px; color: #888;">JuanBayan, 123 Main Street, City, Philippines</p>
                    </div>
                `
            };

            // Send the donation receipt email to the donor
            await sendEmail(donorEmailOptions);
        }

        // Send the donation receipt email to the donor (in case donation is below 500,000 PHP)
        const emailOptions = {
            to: account.acc_email,
            subject: `Donation Receipt for Campaign: ${campaign.Campaign_Name}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #5b9bd5;">Donation Receipt</h2>
                    <p>Dear ${account.acc_firstname} ${account.acc_lastname},</p>
                    <p>Thank you for your generous donation of <strong>${amount.toLocaleString()} PHP</strong> to the campaign <strong>${campaign.Campaign_Name}</strong>.</p>
                    <h4 style="color: #5b9bd5;">Donation Details:</h4>
                    <ul style="line-height: 1.6;">
                        <li><strong>Campaign Name:</strong> ${campaign.Campaign_Name}</li>
                        <li><strong>Description:</strong> ${campaign.Campaign_Description}</li>
                        <li><strong>Amount Donated:</strong> ${amount.toLocaleString()} PHP</li>
                        <li><strong>Fee Percentage:</strong> ${(feePercentage * 100).toFixed(1)}%</li>
                        <li><strong>Amount Credited to Campaign:</strong> ${amountAfterFee.toLocaleString()} PHP</li>
                        <li><strong>Points Earned:</strong> ${pointsEarned}</li>
                        <li><strong>Donation Date:</strong> ${donationDate}</li>
                    </ul>
                    <p>Your contribution makes a difference. We appreciate your support!</p>
                    <hr style="border: none; border-top: 1px solid #ccc;">
                    <p style="font-size: 12px; color: #888;">If you have any questions, feel free to contact us at <a href="mailto:juanbayan.ph@gmail.com">juanbayan.ph@gmail.com</a>.</p>
                    <p style="font-size: 12px; color: #888;">JuanBayan, 123 Main Street, City, Philippines</p>
                </div>
            `
        };

        // Send the donation receipt email to the donor
        await sendEmail(emailOptions);

        return {
            message: 'Donation confirmed, campaign updated, points added successfully, and flagged for high donation',
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
            ],
            
            order: [['donation_date', 'DESC']]  // Sort by donation_date in descending order

        });

        return donations.map(donation => detailedDonation(donation));
    } catch (error) {
        throw error;
    }
}


async function getFeeAmounts() {
    try {
        const feeAmounts = await db.Donation.findAll({
            attributes: ['donation_id', 'fee_amount', 'donation_date'], // Select donation_id and fee_amount
            include: [
                {
                    model: db.Campaign, // Include the Campaign model
                    as: 'campaign', // Specify the alias used in the association
                    attributes: ['Campaign_Name'], // Select the Campaign_Name from the Campaign model
                }
            ]
        });

        // Calculate the total fee amount
        const totalFeeAmount = feeAmounts.reduce((total, { fee_amount }) => total + fee_amount, 0);

        // Map the fee amounts to include Campaign_Name and donation_date
        return {
            totalFeeAmount,
            feeAmounts: feeAmounts.map(({ donation_id, fee_amount, campaign, donation_date }) => ({
                donation_id,
                fee_amount,
                Campaign_Name: campaign.Campaign_Name, // Fetch from the included Campaign model
                donation_date
            }))
        };
    } catch (error) {
        throw error;
    }
}

