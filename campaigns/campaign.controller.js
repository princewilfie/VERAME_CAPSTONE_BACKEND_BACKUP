const express = require('express');
const router = express.Router();
const multer = require('_middleware/multer-config');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const campaignService = require('./campaign.service');

// Use multer for file uploads, with error handling
router.post('/', multer.single('image'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    createSchema(req, res, next);
}, create);

router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', multer.single('image'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    updateSchema(req, res, next);
}, update);
router.delete('/:id', _delete);

module.exports = router;

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

function getAll(req, res, next) {
    campaignService.getAll()
        .then(campaigns => res.json(campaigns))
        .catch(next);
}

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
