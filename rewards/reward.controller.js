const express = require('express');
const router = express.Router();
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const rewardService = require('./reward.service');
const authorize = require('_middleware/authorize');

// Routes
router.post('/', authorize('Admin'), createSchema, create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', authorize('Admin'), updateSchema, update);
router.delete('/:id', authorize('Admin'), _delete);
router.post('/:id/consume', authorize('Admin'), consume);

module.exports = router;

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        reward_Name: Joi.string().required(),
        reward_Description: Joi.string().required(),
        reward_PointCost: Joi.number().required(),
        reward_Quantity: Joi.number().required(),
        reward_Status: Joi.string().valid('Active', 'Inactive').required()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        reward_Name: Joi.string().optional(),
        reward_Description: Joi.string().optional(),
        reward_PointCost: Joi.number().optional(),
        reward_Quantity: Joi.number().optional(),
        reward_Status: Joi.string().valid('Active', 'Inactive').optional()
    });
    validateRequest(req, next, schema);
}

// Controller functions
function create(req, res, next) {
    rewardService.create(req.body)
        .then(reward => res.json(reward))
        .catch(next);
}

function getAll(req, res, next) {
    rewardService.getAll()
        .then(rewards => res.json(rewards))
        .catch(next);
}

function getById(req, res, next) {
    rewardService.getById(req.params.id)
        .then(reward => res.json(reward))
        .catch(next);
}

function update(req, res, next) {
    rewardService.update(req.params.id, req.body)
        .then(reward => res.json(reward))
        .catch(next);
}

function _delete(req, res, next) {
    rewardService._delete(req.params.id)
        .then(() => res.json({ message: 'Reward deleted successfully' }))
        .catch(next);
}

function consume(req, res, next) {
    rewardService.consume(req.params.id)
        .then(() => res.json({ message: 'Reward consumed and status updated to Inactive' }))
        .catch(next);
}