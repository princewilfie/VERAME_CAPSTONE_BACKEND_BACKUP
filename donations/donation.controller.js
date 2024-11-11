const express = require('express'); 
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const donationService = require('./donation.service');


const Campaign = require('../campaigns/campaign.model');  // Import Campaign Model
const { Sequelize } = require('../campaigns/campaign.model');  // Import Sequelize for transaction


// routes
router.get('/', getAll);
router.get('/fees', getFeeAmounts); 
router.get('/:id', getById);
router.post('/create', createSchema, create);


// kani
router.post('/create-gcash-payment', createGcashPaymentSchema, createGcashPayment);
router.get('/campaign/:campaignId', getByCampaignId);


// Success and Failure routes for PayMongo
router.get('/success', handlePaymentSuccess);





module.exports = router;

// Create donation schema validation
function createSchema(req, res, next) {
    const schema = Joi.object({
        acc_id: Joi.number().required(),
        campaign_id: Joi.number().required(),
        donation_amount: Joi.number().required(),
    });
    validateRequest(req, next, schema);
}

async function create(req, res, next) {
    const transaction = await Sequelize.transaction();  

    try {
        const { acc_id, campaign_id, donation_amount } = req.body;

        const donation = await db.Donation.create({
            acc_id,
            campaign_id,
            donation_amount,
        }, { transaction });

        if (!donation) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Failed to save donation' });
        }

        // Step 2: Initiate GCash Payment
        const paymentData = await donationService.createGcashPayment({
            amount: donation_amount,
            campaignId: campaign_id,
            accId: acc_id,
            description: `Donation for campaign ID ${campaign_id}`,
            remarks: 'GCASH Donation',
        });

        if (!paymentData) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Failed to initiate GCash payment' });
        }

        // Step 3: Commit transaction and return the payment link
        await transaction.commit();
        res.status(201).json({ donation, paymentLink: paymentData.checkout_url });

    } catch (error) {
        await transaction.rollback();
        console.error('Error in creating donation:', error.message);
        next(error);
    }
}


// Get all donations
function getAll(req, res, next) {
    donationService.getAll()
        .then(donations => res.json(donations))
        .catch(next);
}

// Get donation by ID
function getById(req, res, next) {
    donationService.getById(req.params.id)
        .then(donation => donation ? res.json(donation) : res.sendStatus(404))
        .catch(next);
}

// Create GCash payment schema validation
function createGcashPaymentSchema(req, res, next) {
    const schema = Joi.object({
        amount: Joi.number().required(),
        campaignId: Joi.number().required(),
        accId: Joi.number().required(),
        description: Joi.string().optional(),
        remarks: Joi.string().optional(),
    });
    validateRequest(req, next, schema);
}

function getByCampaignId(req, res, next) {
    donationService.getByCampaignId(req.params.campaignId)
        .then(donations => res.json(donations))
        .catch(next);
}

// Handle GCASH payment initiation
async function createGcashPayment(req, res, next) {
    try {
        const { amount, campaignId, accId, description, remarks } = req.body;
        
        const paymentData = await donationService.createGcashPayment({
            amount,
            campaignId,
            accId,
            description,
            remarks,
        });

        console.log('Payment Data from GCash API:', paymentData); // Log the full response

        
        res.json(paymentData);
    } catch (error) {
        console.error('Error in GCash payment initiation:', error.message); // Log the error
        next(error);
    }
}


// Success route for PayMongo
async function handlePaymentSuccess(req, res, next) {
    const transaction = await Sequelize.transaction();  // Start transaction
    try {
        const { donation_id, acc_id, campaign_id, donation_amount } = req.query;

        // Save donation details to the database
        const donation = await donationService.create({
            acc_id: acc_id,
            campaign_id: campaign_id,
            donation_amount: donation_amount,
        }, { transaction });

        // Fetch and update the campaign's current raised funds
        const campaign = await Campaign.findByPk(campaign_id, { transaction });
        
        if (!campaign) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Campaign not found' });
        }

        campaign.Campaign_CurrentRaised += donation_amount;
        await campaign.save({ transaction });

        // Commit the transaction
        await transaction.commit();

        console.log('Payment success:', { donation, updatedCampaign: campaign });
        
        // Handle success response
        res.json({ message: 'Payment success', donation, updatedCampaign: campaign });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

function getFeeAmounts(req, res, next) {
    donationService.getFeeAmounts()
        .then(({ totalFeeAmount, feeAmounts }) => res.json({ totalFeeAmount, feeAmounts }))
        .catch(next);
}