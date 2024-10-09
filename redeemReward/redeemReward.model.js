const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        redeemReward_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        acc_id: { type: DataTypes.INTEGER, allowNull: false }, // FK1 - Account ID
        reward_ID: { type: DataTypes.INTEGER, allowNull: false }, // FK2 - Reward ID
        redeemReward_RedemptionDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        redeemReward_address: { type: DataTypes.STRING, allowNull: false } // User's address for shipping
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('RedeemReward', attributes, options);
}

module.exports = model;
