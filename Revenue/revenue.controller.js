const express = require('express');
const router = express.Router();
const revenueService = require('./revenue.service');
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const donationService = require('../donations/donation.service'); // Import donation service to fetch donation details


// routes
router.post('/', createSchema, create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', updateSchema, update);
router.delete('/:id', remove);

// Revenue creation schema validation
function createSchema(req, res, next) {
    const schema = Joi.object({
        donation_id: Joi.number().required(),
        
    });
    validateRequest(req, next, schema);
}

// Revenue update schema validation
function updateSchema(req, res, next) {
    const schema = Joi.object({
        amount: Joi.number().optional(),
        // Add other fields as necessary
    });
    validateRequest(req, next, schema);
}

async function create(req, res) {
    try {
        const { donation_id } = req.body;

        // Fetch the donation details to populate the revenue fields
        const donation = await donationService.getById(donation_id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        // Calculate the fee and final amount based on your business logic
        const fee_amount = donation.donation_amount * 0.10; // Example: 10% fee
        const final_amount = donation.donation_amount - fee_amount;
        const tax = donation.donation_amount >= 250000 ? (final_amount * 0.05) : 0; // Example: 5% tax if above 250,000

        // Create the revenue record
        const revenue = await revenueService.createRevenue({
            donation_id,
            amount: donation.donation_amount, // Set the amount from donation
            fee_amount,
            final_amount,
            date_created: new Date(),
            tax,
        });

        res.status(201).json(revenue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


// Get all revenues
async function getAll(req, res) {
    try {
        const revenues = await revenueService.getAllRevenues();
        res.status(200).json(revenues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get revenue by ID
async function getById(req, res) {
    try {
        const revenue = await revenueService.getRevenueById(req.params.id);
        if (!revenue) return res.status(404).json({ message: 'Revenue not found' });
        res.status(200).json(revenue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Update revenue
async function update(req, res) {
    try {
        const revenue = await revenueService.updateRevenue(req.params.id, req.body);
        if (!revenue) return res.status(404).json({ message: 'Revenue not found' });
        res.status(200).json(revenue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Delete revenue
async function remove(req, res) {
    try {
        const revenue = await revenueService.deleteRevenue(req.params.id);
        if (!revenue) return res.status(404).json({ message: 'Revenue not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = router;
