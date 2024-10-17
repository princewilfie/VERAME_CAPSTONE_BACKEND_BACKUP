const express = require('express');
const router = express.Router();
const multer = require('_middleware/multer-config');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const eventService = require('./event.service');
const authorize = require('_middleware/authorize');

const eventParticipantService = require('../eventParticipant/eventParticipant.service'); // Importing the event participant service

// Use multer for file uploads
router.post('/', multer.single('Event_Image'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    createSchema(req, res, next);
}, create);

router.get('/account/:id', getByAccountId); // Route to get events by account ID
router.get('/', getAll);

router.get('/approved', getAllApproved);  

router.get('/:id', getById);

router.put('/:id', multer.single('Event_Image'), (req, res, next) => {
    updateSchema(req, res, next);
}, update);



router.delete('/:id', authorize('Admin'), _delete);

router.put('/:id/approve', authorize('Admin'), approve);
router.put('/:id/reject', authorize('Admin'), reject);


// Update route for getting participants by Event_ID in the request body
router.post('/participants', getEventParticipants); // Change this line
router.post('/join', joinEvent); // Ensure this line is present

module.exports = router;

function createSchema(req, res, next) {
    const schema = Joi.object({
        Acc_ID: Joi.number().required(),
        Event_Name: Joi.string().required(),
        Event_Description: Joi.string().required(),
        Event_Start_Date: Joi.date().required(),
        Event_End_Date: Joi.date().required(),
        Event_Location: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    eventService.create(req.body, req.file)
        .then(event => res.json(event))
        .catch(next);
}

function getAll(req, res, next) {
    eventService.getAll()
        .then(events => res.json(events))
        .catch(next);
}

function getAllApproved(req, res, next) {  // Handler for approved events
    eventService.getAllApproved()
        .then(events => res.json(events))
        .catch(next);
}


function getById(req, res, next) {
    eventService.getById(req.params.id)
        .then(event => res.json(event))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        Event_Name: Joi.string().empty(''),
        Event_Description: Joi.string().empty(''),
        Event_Start_Date: Joi.date().empty(''),
        Event_End_Date: Joi.date().empty(''),
        Event_Location: Joi.string().empty(''),
        Event_Status: Joi.number().empty('')
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    
    eventService.update(req.params.id, req.body, req.file)
        .then(event => res.json(event))
        .catch(err => {
            console.error('Error updating event:', err);
            res.status(500).json({ message: 'Failed to update event', error: err.message });
        });
}

function _delete(req, res, next) {
    eventService._delete(req.params.id)
        .then(() => res.json({ message: 'Event deleted successfully' }))
        .catch(next);
}

function approve(req, res, next) {
    eventService.approve(req.params.id)
        .then(event => res.json(event))
        .catch(next);
}

function reject(req, res, next) {
    eventService.reject(req.params.id)
        .then(event => res.json(event))
        .catch(next);
}

function getByAccountId(req, res, next) {
    const accountId = req.params.id;
    eventService.getByAccountId(accountId)
        .then(events => res.json(events))
        .catch(next);
}


// join event 
function joinEvent(req, res, next) {
    console.log('Request body:', req.body); // Log the request body
    const { Acc_ID, Event_ID } = req.body;
    eventParticipantService.joinEvent(Acc_ID, Event_ID)
        .then(message => res.json(message))
        .catch(next);
}

// Update getEventParticipants to use request body instead of URL params
function getEventParticipants(req, res, next) {
    const { Event_ID } = req.body; // Get Event_ID from the request body
    if (!Event_ID) {
        return res.status(400).json({ message: 'Event_ID is required' }); // Validate input
    }
    eventParticipantService.getAllParticipants(Event_ID) // Call the service function
        .then(participants => res.json(participants))
        .catch(next);
}