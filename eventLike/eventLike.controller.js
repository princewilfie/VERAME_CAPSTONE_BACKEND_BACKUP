// eventLikes.controller.js
const express = require('express');
const router = express.Router();
const eventLikesService = require('./eventLike.service');
const authorize = require('_middleware/authorize'); // Adjust as needed

// Create a like for an event
router.post('/', authorize(), create);

// Get likes by event ID
router.get('/event/:id', getByEventId);

// Delete a like (unlike)
router.delete('/:id', authorize(), _delete);

module.exports = router;

function create(req, res, next) {
    eventLikesService.create(req.body)
        .then(eventLike => res.json(eventLike))
        .catch(next);
}

function getByEventId(req, res, next) {
    eventLikesService.getByEventId(req.params.id)
        .then(eventLikes => res.json(eventLikes))
        .catch(next);
}

function _delete(req, res, next) {
    eventLikesService._delete(req.params.id)
        .then(() => res.json({ message: 'Event like removed successfully' }))
        .catch(next);
}
