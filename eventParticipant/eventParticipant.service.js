const db = require('_helpers/db');

module.exports = {
    joinEvent,
    getJoinedEvents,
    getAllParticipants// Ensure this is exported

};

async function joinEvent(accId, eventId) {
    // Check if the event exists
    const event = await db.Event.findByPk(eventId);
    if (!event) throw 'Event not found';

    // Check if the user has already joined the event
    const existingParticipant = await db.EventParticipant.findOne({ where: { Acc_ID: accId, Event_ID: eventId } });
    if (existingParticipant) throw 'User already joined this event';

    // Create a new participant record with joinedAt timestamp
    const participant = await db.EventParticipant.create({ Acc_ID: accId, Event_ID: eventId });

    return { 
        message: 'Joined event successfully', 
        joinedAt: participant.joinedAt // Optional: Return the joinedAt timestamp
    };
}

async function getJoinedEvents(accId) {
    // Find all events that the user has joined
    const participants = await db.EventParticipant.findAll({ 
        where: { Acc_ID: accId }, 
        include: db.Event 
    });
    
    return participants.map(participant => ({
        ...participant.toJSON(),
        joinedAt: participant.joinedAt // Include the joinedAt timestamp if needed
    }));
}

async function getAllParticipants(eventId) {
    // Find all participants for the given event
    const participants = await db.EventParticipant.findAll({ where: { Event_ID: eventId } });

    return participants.map(participant => participant.toJSON());
}
