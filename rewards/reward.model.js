const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        reward_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        reward_Name: { type: DataTypes.STRING, allowNull: false },
        reward_Description: { type: DataTypes.STRING, allowNull: false },
        reward_PointCost: { type: DataTypes.INTEGER, allowNull: false },
        reward_Quantity: { type: DataTypes.INTEGER, allowNull: false },
        reward_Status: { type: DataTypes.STRING, allowNull: false } // E.g. Active, Inactive
    };

    const options = {
        timestamps: false,
    };

    return sequelize.define('Reward', attributes, options);
}

module.exports = model;
