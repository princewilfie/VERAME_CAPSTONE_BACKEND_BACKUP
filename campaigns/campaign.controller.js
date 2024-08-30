const express = require('express');
const router = express.Router();
const multer = require('_middleware/multer-config');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const campaignService = require('./campaign.service');
const authorize = require('_middleware/authorize');

// Use multer for file uploads, with error handling
router.post('/', multer.single('Campaign_Image'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    createSchema(req, res, next);
}, create);

// Get all approved campaigns
router.get('/', getAll);

// Get an approved campaign by ID
router.get('/:id', getById);

// Update a campaign, with file upload
router.put('/:id', multer.single('image'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    updateSchema(req, res, next);
}, update);

// Delete a campaign
router.delete('/:id', authorize('Admin'), _delete); // Only accessible by admin

// Approve a campaign (only accessible by admin)
router.put('/:id/approve', authorize('Admin'), approve);

// Reject a campaign (only accessible by admin)
router.put('/:id/reject', authorize('Admin'), reject);

module.exports = router;

// Function to approve a campaign
function approve(req, res, next) {
    campaignService.approve(req.params.id)
        .then(campaign => res.json(campaign))
        .catch(next);
}

// Function to reject a campaign
function reject(req, res, next) {
    campaignService.reject(req.params.id)
        .then(campaign => res.json(campaign))
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        Acc_ID: Joi.number().required(),
        Campaign_Name: Joi.string().required(),
        Campaign_Description: Joi.string().required(),
        Campaign_TargetFund: Joi.number().required(),
        Campaign_Start: Joi.date().required(),
        Campaign_End: Joi.date().required(),
        Campaign_Status: Joi.number().required(),
        Campaign_Category: Joi.number().required(),
        Campaign_Feedback: Joi.number().allow(null)
    
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    console.log('File:', req.file); // Log file info to verify
    campaignService.create(req.body, req.file)
        .then(campaign => res.json(campaign))
        .catch(next);
}

// Function to get all approved campaigns
function getAll(req, res, next) {
    campaignService.getAll()
        .then(campaigns => res.json(campaigns))
        .catch(next);
}

// Function to get a specific approved campaign by ID
function getById(req, res, next) {
    campaignService.getById(req.params.id)
        .then(campaign => res.json(campaign))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        Campaign_Name: Joi.string().empty(''),
        Campaign_Description: Joi.string().empty(''),
        Campaign_TargetFund: Joi.number().empty(''),
        Campaign_Start: Joi.date().empty(''),
        Campaign_End: Joi.date().empty(''),
        Campaign_Status: Joi.number().empty(''),
        Campaign_Category: Joi.number().empty(''),
        Campaign_Feedback: Joi.number().empty('')
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    console.log('File:', req.file); // Log file info to verify
    campaignService.update(req.params.id, req.body, req.file)
        .then(campaign => res.json(campaign))
        .catch(next);
}

function _delete(req, res, next) {
    campaignService._delete(req.params.id)
        .then(() => res.json({ message: 'Campaign deleted successfully' }))
        .catch(next);
}
