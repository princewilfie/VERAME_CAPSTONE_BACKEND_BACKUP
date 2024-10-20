const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Withdraw_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Campaign_ID: { type: DataTypes.INTEGER, allowNull: false },
        acc_id: { type: DataTypes.INTEGER, allowNull: false },
        Acc_number: { type: DataTypes.STRING, allowNull: false },  // Add Acc_number field
        Bank_account: { type: DataTypes.STRING, allowNull: false },  // Add Bank_account field
        Withdraw_Amount: { type: DataTypes.FLOAT, allowNull: false },
        Status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },
        Request_Date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('withdraw', attributes, options);
}

module.exports = model;
