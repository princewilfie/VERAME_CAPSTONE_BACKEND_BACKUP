const express = require('express');
const router = express.Router();
const eventParticipantService = require('./eventParticipant.service');

// Route to join an event
router.post('/join', joinEvent);

// Route to get joined events for an account
router.get('/account/:accId/joined', getJoinedEvents);

// Route to get all participants for an event
router.get('/event/:eventId/participants', getEventParticipants);
router.get('/participants', getAll);

module.exports = router;

// Controller functions

function joinEvent(req, res, next) {
    const { Acc_ID, Event_ID } = req.body;
    eventParticipantService.joinEvent(Acc_ID, Event_ID)
        .then(message => res.json(message))
        .catch(next);
}

function getJoinedEvents(req, res, next) {
    const accId = req.params.accId;
    eventParticipantService.getJoinedEvents(accId)
        .then(events => res.json(events))
        .catch(next);
}

function getEventParticipants(req, res, next) {
    const eventId = req.params.eventId;
    eventParticipantService.getAllParticipants(eventId)
        .then(participants => res.json(participants))
        .catch(next);
}

function getAll(req, res, next) {
    eventParticipantService.getAll()
        .then(participants => res.json(participants))
        .catch(next);
}