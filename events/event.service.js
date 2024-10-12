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
    getByAccountId    

};

async function create(params, file) {
    const defaultImagePath = path.basename('default-event.png');
    const imagePath = file ? path.basename(file.path) : defaultImagePath;

    const event = new db.Event({
        ...params,
        Event_Image: imagePath,
        Event_ApprovalStatus: 'Pending' // Default to 'Pending' when created
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
    event.Event_ApprovalStatus = 'Approved';  // Set to 'Approved'
    await event.save();
    return event;
}

async function reject(id) {
    const event = await getById(id);
    event.Event_ApprovalStatus = 'Rejected';  // Set to 'Rejected'
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
            Event_ApprovalStatus: 'Approved'  // Fetch only approved events
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
