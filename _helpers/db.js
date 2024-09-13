const config = require('config.json');
const mysql = require('mysql2/promise');
const {Sequelize} = require('sequelize');

module.exports = db = {};

initialize();


async function initialize() {

    const { host, port, user, password, database} = config.database;
    const connection = await mysql.createConnection({host, port, user, password});
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    const sequelize = new Sequelize(database, user, password, { 
        host, port, dialect: 'mysql'});

    //accounts
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    //refreshtoken
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE'});
    db.RefreshToken.belongsTo(db.Account);
    
    //campaign
    db.Campaign = require('../campaigns/campaign.model')(sequelize);
    db.Account.hasMany(db.Campaign, { onDelete: 'CASCADE' });
    db.Campaign.belongsTo(db.Account);

    //donation
    db.Donation = require('../donations/donation.model')(sequelize); 
    db.Account.hasMany(db.Donation, { onDelete: 'CASCADE' }); 
    db.Campaign.hasMany(db.Donation, { onDelete: 'CASCADE' });
    db.Donation.belongsTo(db.Account); 
    db.Donation.belongsTo(db.Campaign); 

    await sequelize.sync();
}