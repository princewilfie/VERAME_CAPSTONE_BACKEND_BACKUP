// eventComments.service.js
const db = require('_helpers/db');

module.exports = {
    create,
    getByEventId,
    getById,
    _delete,
    update
};

async function create(params) {
    const accountExists = await db.Account.findByPk(params.Acc_ID);
    if (!accountExists) throw 'Account not found';

    const comment = new db.EventComment({
        ...params,
        Comment_Text: params.Comment_Text,
        Created_At: new Date(),
    });

    await comment.save();
    return comment;
}

async function update(id, params) {
    const comment = await getById(id);

    // Update the comment text
    if (params.Comment_Text) {
        comment.Comment_Text = params.Comment_Text;
    }

    await comment.save();
    return comment;
}

async function getByEventId(eventId) {
    const comments = await db.EventComment.findAll({
        where: { Event_ID: eventId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname', 'acc_image'] // Include needed account fields
        }]
    });

    return comments;
}

async function getById(id) {
    const comment = await db.EventComment.findByPk(id);
    if (!comment) throw 'Comment not found';
    return comment;
}

async function _delete(id) {
    const comment = await getById(id);
    await comment.destroy();
}
