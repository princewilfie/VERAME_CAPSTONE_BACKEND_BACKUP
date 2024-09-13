const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        donation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        acc_id: { type: DataTypes.INTEGER, allowNull: false },
        campaign_id: { type: DataTypes.INTEGER, allowNull: false },
        donation_amount: { type: DataTypes.FLOAT, allowNull: false },
        donation_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('Donation', attributes, options);
}
