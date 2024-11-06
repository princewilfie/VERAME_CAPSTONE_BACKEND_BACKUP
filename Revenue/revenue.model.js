const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        revenue_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        donation_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false, // Ensure that this can be set directly
        },
        fee_amount: { type: DataTypes.FLOAT, allowNull: true },
        final_amount: { type: DataTypes.FLOAT, allowNull: false },
        date_created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        tax: { type: DataTypes.FLOAT, allowNull: true },
        Campaign_ID: { type: DataTypes.INTEGER, allowNull: false },  // Add this line for Campaign_ID
       
    };

    const options = {
        timestamps: false
    };

    const Revenue = sequelize.define('Revenue', attributes, options);

    // Define associations
    Revenue.associate = function(models) {
        Revenue.belongsTo(models.Donation, { foreignKey: 'donation_id', as: 'donation' });
        Revenue.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });

    };

    return Revenue;
}
