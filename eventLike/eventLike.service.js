// eventLikes.service.js
const db = require('_helpers/db'); // Adjust the path as necessary

module.exports = {
    create,
    getByEventId,
    _delete
};

async function create(params) {
    const accountExists = await db.Account.findByPk(params.Acc_ID);
    if (!accountExists) throw 'Account not found';

    const likeExists = await db.EventLike.findOne({
        where: {
            Event_ID: params.Event_ID,
            Acc_ID: params.Acc_ID
        }
    });

    if (likeExists) throw 'You have already liked this event';

    const eventLike = new db.EventLike({
        Event_ID: params.Event_ID,
        Acc_ID: params.Acc_ID,
        Created_At: new Date()
    });

    await eventLike.save();
    return eventLike;
}

async function getByEventId(eventId) {
    const eventLikes = await db.EventLike.findAll({
        where: { Event_ID: eventId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname'] // Include needed account fields
        }]
    });

    return eventLikes;
}

async function _delete(id) {
    const eventLike = await db.EventLike.findByPk(id);
    if (!eventLike) throw 'Event like not found';
    await eventLike.destroy();
}
