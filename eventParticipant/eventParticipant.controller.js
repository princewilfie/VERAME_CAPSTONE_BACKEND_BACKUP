const express = require('express');
const router = express.Router();
const eventParticipantService = require('./eventParticipant.service');

// Route to join an event
router.post('/join', joinEvent);

// Route to get joined events for an account
router.get('/account/:accId/joined', getJoinedEvents);

module.exports = router;

// Controller functions

function joinEvent(req, res, next) {
    const { Acc_ID, Event_ID } = req.body; // Expecting Acc_ID and Event_ID in the request body
    eventParticipantService.joinEvent(Acc_ID, Event_ID)
        .then(message => res.json(message))
        .catch(next);
}

function getJoinedEvents(req, res, next) {
    const accId = req.params.accId;  // Expecting Acc_ID as URL param
    eventParticipantService.getJoinedEvents(accId)
        .then(events => res.json(events))
        .catch(next);
}
