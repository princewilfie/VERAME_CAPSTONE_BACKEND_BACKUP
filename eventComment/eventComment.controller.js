const express = require('express');
const router = express.Router();
const eventCommentsService = require('./eventComment.service');
const authorize = require('_middleware/authorize');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');

// Create a comment
router.post('/', validateComment, create);

// Get comments by event ID
router.get('/event/:id', getByEventId);

// Delete a comment
router.delete('/:id', authorize(), _delete);

module.exports = router;

// Validation schema for event comments
function validateComment(req, res, next) {
    const schema = Joi.object({
        Event_ID: Joi.number().required(),
        Acc_ID: Joi.number().required(),
        Comment_Text: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    eventCommentsService.create(req.body)
        .then(comment => res.json(comment))
        .catch(next);
}

function getByEventId(req, res, next) {
    eventCommentsService.getByEventId(req.params.id)
        .then(comments => res.json(comments))
        .catch(next);
}

function _delete(req, res, next) {
    eventCommentsService._delete(req.params.id)
        .then(() => res.json({ message: 'Comment deleted successfully' }))
        .catch(next);
}
