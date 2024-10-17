const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Event_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Event_Name: { type: DataTypes.STRING, allowNull: false },
        Event_Description: { type: DataTypes.TEXT, allowNull: false },
        Event_Start_Date: { type: DataTypes.DATE, allowNull: false },
        Event_End_Date: { type: DataTypes.DATE, allowNull: false },
        Event_Location: { type: DataTypes.STRING, allowNull: false },
        Event_Status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        Event_Image: { type: DataTypes.STRING, allowNull: true },
        Event_ApprovalStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' }

    };

    const options = {
        timestamps: false
    };

    return sequelize.define('event', attributes, options);
}

module.exports = model;