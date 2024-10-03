const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        reward_Name: { type: DataTypes.STRING, allowNull: false }, // Still required
        reward_Description: { type: DataTypes.STRING, allowNull: false }, // Still required
        reward_PointCost: { type: DataTypes.INTEGER, allowNull: false }, // Still required
        reward_Quantity: { type: DataTypes.INTEGER, allowNull: false }, // Still required
        reward_Status: { 
            type: DataTypes.STRING, 
            allowNull: true, // Changed to true
            defaultValue: 'Available' // Default value is still set
        },
        reward_Image: { type: DataTypes.STRING, allowNull: true } // Add the reward image path field
    };

    const options = {
        timestamps: false
    };

    return sequelize.define('reward', attributes, options);
}

module.exports = model;
