const express = require('express');
const router = express.Router();
const likesService = require('./likes.service');
const authorize = require('_middleware/authorize'); // Adjust as needed

// Create a like
router.post('/', authorize(), create);

// Get likes by campaign ID
router.get('/campaign/:id', getByCampaignId);

// Delete a like (unlike)
router.delete('/:id', authorize(), _delete);

module.exports = router;

function create(req, res, next) {
    likesService.create(req.body)
        .then(like => res.json(like))
        .catch(next);
}

function getByCampaignId(req, res, next) {
    likesService.getByCampaignId(req.params.id)
        .then(likes => res.json(likes))
        .catch(next);
}

function _delete(req, res, next) {
    likesService._delete(req.params.id)
        .then(() => res.json({ message: 'Like removed successfully' }))
        .catch(next);
}
