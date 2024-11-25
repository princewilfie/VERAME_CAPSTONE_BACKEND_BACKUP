const db = require('_helpers/db');

module.exports = {
    joinEvent,
    getJoinedEvents,
    getAllParticipants,
    getAll,
    markAttendance
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

async function markAttendance(participantId, attendance) {
    // Find the participant record
    const participant = await db.EventParticipant.findByPk(participantId);
    if (!participant) throw 'Participant not found';

    // Update the Participant_Attendance field
    participant.Participant_Attendance = attendance;
    await participant.save();

    // If the participant is marked as present, award points
    if (attendance) {
        // Find the associated account
        const account = await db.Account.findByPk(participant.Acc_ID);
        if (!account) throw 'Account not found';

        // Add points to the account (e.g., +10 points)
        account.acc_totalpoints += 2; // Adjust the point value as needed
        await account.save();
    }

    return {
        message: 'Attendance and points updated successfully',
        participant,
    };
}



async function getJoinedEvents(accId) {
    const participants = await db.EventParticipant.findAll({ 
        where: { Acc_ID: accId }, 
        include: [{
            model: db.Event,
            as: 'event',
            attributes: ['Event_Name', 'Event_Image']

        }]
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

async function getAll() {
    const participants = await db.EventParticipant.findAll({
        include: [
            {
                model: db.Account,
                as: 'account',
                attributes: ['acc_firstname', 'acc_lastname', 'acc_image', 'acc_pnumber', 'acc_email']
            },
            {
                model: db.Event,
                as: 'event',
                attributes: ['Event_Name', 'Event_Image']
            }
        ]
    });

    return participants.map(participant => participant.toJSON()); // Return JSON for cleaner response
} 