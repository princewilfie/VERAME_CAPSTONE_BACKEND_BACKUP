const db = require('_helpers/db');
const path = require('path');
const sendEmail = require('_helpers/send-email');




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
    const imagePath = file ? path.basename(file.path) : null;

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
    event.Event_Status = '0'
    event.Event_ApprovalStatus = 'Pending'
    await event.save();
    return event;
}

async function approve(id) {
    const event = await getById(id);
    event.Event_ApprovalStatus = 'Approved';
    event.Event_Status = 1;
    await event.save();

    await sendEmail({
        to: event.account.acc_email,
        subject: 'Event Approved: Congratulations!',
        text: `Your event "${event.Event_Name}" has been approved!`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #4CAF50;">Event Approval Notification</h2>
                <p>Dear ${event.account.acc_firstname} ${event.account.acc_lastname},</p>
                <p>We're excited to inform you that your event, "<strong>${event.Event_Name}</strong>," has been approved and is now live!</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li><strong>Name:</strong> ${event.Event_Name}</li>
                    <li><strong>Description:</strong> ${event.Event_Description}</li>
                    <li><strong>Start Date:</strong> ${event.Event_Start_Date}</li>
                    <li><strong>End Date:</strong> ${event.Event_End_Date}</li>
                    <li><strong>Location:</strong> ${event.Event_Location}</li>
                </ul>
                <p>Thank you for creating an event that contributes to our community.</p>
                <p style="color: #4CAF50; font-weight: bold;">Best Regards,<br>JuanBayan Team</p>
            </div>
        `
    });

    return event;
}

async function reject(id, adminNotes) {
    const event = await getById(id);
    event.Event_ApprovalStatus = 'Rejected';
    event.Event_Status = -1;
    event.Admin_Notes = adminNotes; 
    await event.save();

    await sendEmail({
        to: event.account.acc_email,
        subject: 'Event Rejection Notice',
        text: `Your event "${event.Event_Name}" has been rejected.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #e53935;">Event Rejection Notification</h2>
                <p>Dear ${event.account.acc_firstname} ${event.account.acc_lastname},</p>
                <p>We regret to inform you that your event, "<strong>${event.Event_Name}</strong>," has not been approved at this time.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <h3>Event Summary</h3>
                    <p><strong>Event Name:</strong> ${event.Event_Name}</p>
                    <p><strong>Description:</strong> ${event.Event_Description}</p>
                </div>
                <p><strong>Admin Notes:</strong> ${adminNotes}</p> <!-- Display admin notes in the email -->
                <p>If you have any questions or believe this was a mistake, please reach out to us for further assistance.</p>
                <p>We appreciate your interest in creating events for the community and encourage you to try again.</p>
                <p style="color: #e53935; font-weight: bold;">Sincerely,<br>JuanBayan Team</p>
            </div>
        `
    });

    return event;
}


async function getAll() {
    return await db.Event.findAll({
        include: [
            {
                model: db.Account,
                as: 'account',
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email'] // Include these fields
            }
        ]
    });
}

async function getAllApproved() {
    return await db.Event.findAll({
        where: {
            Event_ApprovalStatus: 'Approved',
            Event_Status: 1
        }
    });
}


async function getById(id) {
    const event = await db.Event.findByPk(id, {
        include: [
            {
                model: db.Account,
                as: 'account',
                attributes: ['acc_firstname', 'acc_lastname', 'acc_email'] // Include these fields
            }
        ]
    });
    if (!event) throw 'Event not found';
    return event;
}


async function _delete(id) {
    const event = await getById(id);
    await event.destroy();
}

async function getByAccountId(accountId) {
    const events = await db.Event.findAll({
        where: { Acc_ID: accountId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname', 'acc_email'] // Add other fields as needed
        }]
    });
    return events;
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