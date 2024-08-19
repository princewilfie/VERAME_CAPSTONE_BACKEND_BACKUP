const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Campaign_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Campaign_Name: { type: DataTypes.STRING, allowNull: false },
        Campaign_Description: { type: DataTypes.TEXT, allowNull: false },
        Campaign_TargetFund: { type: DataTypes.FLOAT, allowNull: false },
        Campaign_CurrentRaised: { type: DataTypes.FLOAT, defaultValue: 0 },
        Campaign_Start: { type: DataTypes.DATE, allowNull: false },
        Campaign_End: { type: DataTypes.DATE, allowNull: false },
        Campaign_Status: { type: DataTypes.INTEGER, allowNull: false },
        Campaign_Category: { type: DataTypes.INTEGER, allowNull: false },
        Campaign_Feedback: { type: DataTypes.INTEGER, allowNull: true }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('campaign', attributes, options);
}

module.exports = model;
