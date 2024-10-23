// comments.service.js
const db = require('_helpers/db'); // Adjust the path as necessary
const { Comment } = require('./comment.model'); // Ensure this path is correct

module.exports = {
    create,
    getByCampaignId,
    getById,
    _delete,
    update
};

async function create(params) {
    const accountExists = await db.Account.findByPk(params.Acc_ID);
    if (!accountExists) throw 'Account not found';

    const comment = new db.Comment({
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

async function getByCampaignId(campaignId) {
    const comments = await db.Comment.findAll({
        where: { Campaign_ID: campaignId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname', 'acc_image'] // Include needed account fields
        }]
    });

    return comments; // The virtual fields will now be included in the response
}





async function getById(id) {
    const comment = await db.Comment.findByPk(id);
    if (!comment) throw 'Comment not found';
    return comment;
}

async function _delete(id) {
    const comment = await getById(id);
    await comment.destroy();
}
