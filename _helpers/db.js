require('dotenv').config(); // Load environment variables

const { Sequelize, Op } = require('sequelize');

const db = {};

// Load environment variables
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASS || !DB_NAME) {
    console.error("Missing database environment variables!");
    process.exit(1);
}

// Initialize Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: false
});

db.Op = Op;


    //accounts
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    //refreshtoken
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE'});
    db.RefreshToken.belongsTo(db.Account);
    
    //campaign
    db.Campaign = require('../campaigns/campaign.model')(sequelize);
    db.Account.hasMany(db.Campaign, { foreignKey: 'Acc_ID', as: 'Campaigns' });
    db.Campaign.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });

    //event
    db.Event = require('../events/event.model')(sequelize);
    db.Account.hasMany(db.Event, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.Event.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });


    


    //donation
    db.Donation = require('../donations/donation.model')(sequelize); 

    db.Account.hasMany(db.Donation, { foreignKey: 'acc_id', as: 'Donations', onDelete: 'CASCADE' });
    db.Campaign.hasMany(db.Donation, { foreignKey: 'campaign_id', as: 'Donations', onDelete: 'CASCADE' });


    db.Donation.belongsTo(db.Account, { foreignKey: 'acc_id', as: 'account' }); 
    db.Donation.belongsTo(db.Campaign, { foreignKey: 'campaign_id', as: 'campaign' }); 


    // Rewards
    db.Reward = require('../rewards/reward.model')(sequelize);
    db.Account.hasMany(db.Reward, { onDelete: 'CASCADE' });
    db.Reward.belongsTo(db.Account);


    // RedeemReward
    db.RedeemReward = require('../redeemReward/redeemReward.model')(sequelize);

    // Set up relationships for RedeemReward
    db.Account.hasMany(db.RedeemReward, { onDelete: 'CASCADE' }); // FK1
    db.RedeemReward.belongsTo(db.Account);

    db.Reward.hasMany(db.RedeemReward, { onDelete: 'CASCADE' }); // FK2
    db.RedeemReward.belongsTo(db.Reward);

    // EventParticipant model
    db.EventParticipant = require('../eventParticipant/eventParticipant.model')(sequelize);

    db.Event.hasMany(db.EventParticipant, { foreignKey: 'Event_ID', onDelete: 'CASCADE' });
    db.EventParticipant.belongsTo(db.Event, { foreignKey: 'Event_ID', as: 'event' });
    
    db.Account.hasMany(db.EventParticipant, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.EventParticipant.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });
    

    // Withdraw model
    db.Withdraw = require('../withdraw/withdraw.model')(sequelize);

    // Set up relationships for Withdraw
    db.Account.hasMany(db.Withdraw, { foreignKey: 'acc_id', onDelete: 'CASCADE' }); // An account can make multiple withdrawals
    db.Withdraw.belongsTo(db.Account, { foreignKey: 'acc_id' }); // A withdrawal belongs to one account
    db.Campaign.hasMany(db.Withdraw, { foreignKey: 'Campaign_ID', onDelete: 'CASCADE' }); // A campaign can have multiple withdrawals
    db.Withdraw.belongsTo(db.Campaign, { foreignKey: 'Campaign_ID' }); // A withdrawal belongs to one campaign

    

    // Comment relationships
    db.Comment = require('../comment/comment.model')(sequelize);

    db.Campaign.hasMany(db.Comment, { foreignKey: 'Campaign_ID', onDelete: 'CASCADE' });
    db.Comment.belongsTo(db.Campaign, { foreignKey: 'Campaign_ID' });
    db.Account.hasMany(db.Comment, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.Comment.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });


    // Like model
    db.Like = require('../like/like.model')(sequelize);
    db.Account.hasMany(db.Like, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.Like.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });

    db.Campaign.hasMany(db.Like, { foreignKey: 'Campaign_ID', onDelete: 'CASCADE' });
    db.Like.belongsTo(db.Campaign, { foreignKey: 'Campaign_ID' });

    
    // Category
    db.Category = require('../category/category.model')(sequelize); 
    db.Category.hasMany(db.Campaign, { foreignKey: 'Category_ID', onDelete: 'SET NULL' });
    db.Campaign.belongsTo(db.Category, { foreignKey: 'Category_ID', as: 'category' });

    //Revenue
    db.Revenue = require('../Revenue/revenue.model')(sequelize);
    db.Donation.hasMany(db.Revenue, { foreignKey: 'donation_id', onDelete: 'CASCADE' });
    db.Revenue.belongsTo(db.Donation, { foreignKey: 'donation_id', as: 'donation' });
    db.Revenue.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });


    // EventLike model
    db.EventLike = require('../eventLike/eventLike.model')(sequelize);
    db.Account.hasMany(db.EventLike, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.EventLike.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });

    db.Event.hasMany(db.EventLike, { foreignKey: 'Event_ID', onDelete: 'CASCADE' });
    db.EventLike.belongsTo(db.Event, { foreignKey: 'Event_ID' });


    // eventComment model
    db.EventComment = require('../eventComment/eventComment.model')(sequelize);

    db.Event.hasMany(db.EventComment, { foreignKey: 'Event_ID', onDelete: 'CASCADE' });
    db.EventComment.belongsTo(db.Event, { foreignKey: 'Event_ID' });

    db.Account.hasMany(db.EventComment, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.EventComment.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });



// Sync database
(async () => {
    try {
        await sequelize.sync();
        console.log("Database synchronized successfully.");
    } catch (err) {
        console.error("Database synchronization failed:", err);
    }
})();

db.sequelize = sequelize;

module.exports = db;