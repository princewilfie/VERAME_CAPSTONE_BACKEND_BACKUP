const config = require('config.json');
const mysql = require('mysql2/promise');
const {Sequelize, Op} = require('sequelize');


module.exports = db = {};

initialize();


async function initialize() {

    const { host, port, user, password, database} = config.database;
    const connection = await mysql.createConnection({host, port, user, password});
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    const sequelize = new Sequelize(database, user, password, { 
        host, port, dialect: 'mysql'});
        db.Op = Op;  


    //accounts
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    //refreshtoken
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE'});
    db.RefreshToken.belongsTo(db.Account);
    
    //campaign
    db.Campaign = require('../campaigns/campaign.model')(sequelize);
    db.Account.hasMany(db.Campaign, { onDelete: 'CASCADE' });
    db.Campaign.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });

    //event
    db.Event = require('../events/event.model')(sequelize);
    db.Account.hasMany(db.Event, { foreignKey: 'Acc_ID', onDelete: 'CASCADE' });
    db.Event.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' });


    


    //donation
    db.Donation = require('../donations/donation.model')(sequelize); 
    db.Account.hasMany(db.Donation, { onDelete: 'CASCADE' }); 
    db.Campaign.hasMany(db.Donation, { onDelete: 'CASCADE' });
    db.Donation.belongsTo(db.Account, { foreignKey: 'Acc_ID', as: 'account' }); 
    db.Donation.belongsTo(db.Campaign, { foreignKey: 'Campaign_ID', as: 'campaign' }); 


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

    // Define relationships
    db.Event.hasMany(db.EventParticipant, { onDelete: 'CASCADE' });  // An event can have many participants
    db.EventParticipant.belongsTo(db.Event, {foreignKey: 'Event_ID', as: 'event'});  // A participant belongs to an event
    

    db.Account.hasMany(db.EventParticipant, { onDelete: 'CASCADE' });  // A user can join many events
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



    await sequelize.sync();
}