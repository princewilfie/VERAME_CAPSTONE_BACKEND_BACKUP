const express = require('express'); 
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const donationService = require('./donation.service');

// routes
router.get('/', getAll);
router.get('/:id', getById);
router.post('/create', createSchema, create);

module.exports = router;

function createSchema(req, res, next) {
    const schema = Joi.object({
        acc_id: Joi.number().required(),
        campaign_id: Joi.number().required(),
        donation_amount: Joi.number().required(),
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    donationService.create(req.body)
        .then(donation => res.status(201).json(donation))
        .catch(next);
}

function getAll(req, res, next) {
    donationService.getAll()
        .then(donations => res.json(donations))
        .catch(next);
}

function getById(req, res, next) {
    donationService.getById(req.params.id)
        .then(donation => donation ? res.json(donation) : res.sendStatus(404))
        .catch(next);
}
