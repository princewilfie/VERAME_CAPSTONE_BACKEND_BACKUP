const db = require('_helpers/db');

module.exports = {
    joinEvent,
    getJoinedEvents,
    getAllParticipants
};

async function joinEvent(accId, eventId) {
    const event = await db.Event.findByPk(eventId);
    if (!event) throw 'Event not found';

    const existingParticipant = await db.EventParticipant.findOne({ where: { Acc_ID: accId, Event_ID: eventId } });
    if (existingParticipant) throw 'User already joined this event';

    const participant = await db.EventParticipant.create({ Acc_ID: accId, Event_ID: eventId });

    return { 
        message: 'Joined event successfully', 
        joinedAt: participant.joinedAt
    };
}

async function getJoinedEvents(accId) {
    const participants = await db.EventParticipant.findAll({ 
        where: { Acc_ID: accId }, 
        include: db.Event 
    });
    
    return participants.map(participant => ({
        ...participant.toJSON(),
        joinedAt: participant.joinedAt
    }));
}

async function getAllParticipants(eventId) {
    const participants = await db.EventParticipant.findAll({
        where: { Event_ID: eventId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname', 'acc_image', 'acc_pnumber', 'acc_email'] // Include the needed account fields
        }]
    });

    return participants; // The virtual fields will now be included in the response
}
