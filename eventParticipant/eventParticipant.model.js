const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Participant_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Event_ID: { type: DataTypes.INTEGER, allowNull: false },
        joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } // Automatically set to the current date and time
    };

    const options = {
        timestamps: false // We will manage timestamps manually
    };

    return sequelize.define('EventParticipant', attributes, options);
}

module.exports = model;
