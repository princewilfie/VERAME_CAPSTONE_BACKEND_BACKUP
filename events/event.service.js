const db = require('_helpers/db');
const path = require('path');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete,
    approve,
    reject,
    getAllApproved,
    getByAccountId,
    joinEvent,          // New function for joining events
    getJoinedEvents,    // New function to get joined events
    getEventParticipants // Add this line
};

async function create(params, file) {
    const defaultImagePath = path.basename('default-event.png');
    const imagePath = file ? path.basename(file.path) : defaultImagePath;

    const event = new db.Event({
        ...params,
        Event_Image: imagePath,
        Event_ApprovalStatus: 'Pending'
    });

    await event.save();
    return event;
}

async function update(id, params, file) {
    const event = await getById(id);

    if (file) {
        const newImagePath = path.basename(file.path);
        params.Event_Image = newImagePath;
    }

    Object.assign(event, params);
    await event.save();
    return event;
}

async function approve(id) {
    const event = await getById(id);
    event.Event_ApprovalStatus = 'Approved';
    await event.save();
    return event;
}

async function reject(id) {
    const event = await getById(id);
    event.Event_ApprovalStatus = 'Rejected';
    await event.save();
    return event;
}

async function getAll() {
    return await db.Event.findAll();
}

async function getByAccountId(accountId) {
    return await db.Event.findAll({ where: { Acc_ID: accountId } });
}

async function getAllApproved() {
    return await db.Event.findAll({
        where: {
            Event_ApprovalStatus: 'Approved'
        }
    });
}

async function getById(id) {
    const event = await db.Event.findByPk(id);
    if (!event) throw 'Event not found';
    return event;
}

async function _delete(id) {
    const event = await getById(id);
    await event.destroy();
}

async function joinEvent(accId, eventId) {
    const event = await getById(eventId);
    if (!event) throw 'Event not found';

    const existingParticipant = await db.EventParticipant.findOne({ where: { Acc_ID: accId, Event_ID: eventId } });
    if (existingParticipant) throw 'User already joined this event';

    const participant = new db.EventParticipant({ Acc_ID: accId, Event_ID: eventId });
    await participant.save();
    return { message: 'Joined event successfully' };
}

async function getJoinedEvents(accId) {
    return await db.EventParticipant.findAll({ where: { Acc_ID: accId } });
}

async function getEventParticipants(eventId) {
    return await eventParticipantService.getAllParticipants(eventId); // Call the function from eventParticipant service
}

