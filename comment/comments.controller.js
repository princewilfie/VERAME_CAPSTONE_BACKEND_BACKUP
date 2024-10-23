// comments.controller.js
const express = require('express');
const router = express.Router();
const commentsService = require('./comments.service');
const authorize = require('_middleware/authorize'); // Adjust as needed
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');

// Create a comment
router.post('/', validateComment, create);

// Get comments by campaign ID
router.get('/campaign/:id', getByCampaignId);

// Delete a comment
router.delete('/:id', authorize(), _delete);

module.exports = router;

// Validation schema for comments
function validateComment(req, res, next) {
    const schema = Joi.object({
        Campaign_ID: Joi.number().required(),
        Acc_ID: Joi.number().required(), // Changed from User_ID to Acc_ID
        Comment_Text: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    commentsService.create(req.body)
        .then(comment => res.json(comment))
        .catch(next);
}

function getByCampaignId(req, res, next) {
    commentsService.getByCampaignId(req.params.id)
        .then(comments => res.json(comments))
        .catch(next);
}

function _delete(req, res, next) {
    commentsService._delete(req.params.id)
        .then(() => res.json({ message: 'Comment deleted successfully' }))
        .catch(next);
}
