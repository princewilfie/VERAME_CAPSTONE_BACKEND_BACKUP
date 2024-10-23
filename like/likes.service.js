const db = require('_helpers/db'); // Adjust the path as necessary

module.exports = {
    create,
    getByCampaignId,
    _delete
};

async function create(params) {
    const accountExists = await db.Account.findByPk(params.Acc_ID);
    if (!accountExists) throw 'Account not found';

    const likeExists = await db.Like.findOne({
        where: {
            Campaign_ID: params.Campaign_ID,
            Acc_ID: params.Acc_ID
        }
    });

    if (likeExists) throw 'You have already liked this campaign';

    const like = new db.Like({
        Campaign_ID: params.Campaign_ID,
        Acc_ID: params.Acc_ID,
        Created_At: new Date()
    });

    await like.save();
    return like;
}

async function getByCampaignId(campaignId) {
    const likes = await db.Like.findAll({
        where: { Campaign_ID: campaignId },
        include: [{
            model: db.Account,
            as: 'account',
            attributes: ['acc_firstname', 'acc_lastname'] // Include needed account fields
        }]
    });

    return likes;
}

async function _delete(id) {
    const like = await db.Like.findByPk(id);
    if (!like) throw 'Like not found';
    await like.destroy();
}
