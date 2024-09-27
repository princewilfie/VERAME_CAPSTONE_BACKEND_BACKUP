const db = require('_helpers/db');
const path = require('path');

module.exports = {
    create,
    getAll,
    getById,
    update,
    _delete
};

async function create(params, file) {
    const imagePath = file ? file.path : null; // Handle default image if needed

    const event = new db.Event({
        ...params,
        Event_Image: imagePath
    });

    await event.save();
    return event;
}

async function update(id, params, file) {
    const event = await getById(id);

    if (file) {
        params.Event_Image = file.path;
    }

    Object.assign(event, params);
    await event.save();
    return event;
}

async function getAll() {
    return await db.Event.findAll();
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
