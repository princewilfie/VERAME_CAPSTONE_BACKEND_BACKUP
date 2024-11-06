const db = require('_helpers/db');

async function createRevenue(data) {
    const revenue = await db.Revenue.create(data);
    return revenue;
}

async function getAllRevenues() {
    return await db.Revenue.findAll({
        include: [
            {
                model: db.Donation,
                as: 'donation',
                include: [
                    { model: db.Account, as: 'account' }
                ]
            }
        ]
    });
}

async function getRevenueById(id) {
    return await db.Revenue.findByPk(id, {
        include: [
            {
                model: db.Donation,
                as: 'donation',
                include: [
                    { model: db.Account, as: 'account' }
                ]
            }
        ]
    });
}

async function updateRevenue(id, data) {
    const revenue = await getRevenueById(id);
    if (!revenue) throw new Error('Revenue not found');
    Object.assign(revenue, data);
    await revenue.save();
    return revenue;
}

async function deleteRevenue(id) {
    const revenue = await getRevenueById(id);
    if (!revenue) throw new Error('Revenue not found');
    await revenue.destroy();
    return revenue;
}

// Add function to get revenue by Campaign_ID
// Fetch revenues by Campaign ID in revenue.service.js
async function getRevenueByCampaignId(campaignId) {
    return await db.Revenue.findAll({
        where: { Campaign_ID: campaignId },
        include: [
            {
                model: db.Donation,
                as: 'donation',
                include: [
                    { model: db.Account, as: 'account' }
                ]
            },
            {
                model: db.Campaign,
                as: 'campaign'
            }
        ]
    });
}




module.exports = {
    createRevenue,
    getAllRevenues,
    getRevenueById,
    updateRevenue,
    deleteRevenue,
    getRevenueByCampaignId,  // Expose the new function
    
};
