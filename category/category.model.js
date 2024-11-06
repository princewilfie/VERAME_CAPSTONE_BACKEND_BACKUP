const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Category_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Category_Name: { type: DataTypes.STRING, allowNull: false },
        Category_Description: { type: DataTypes.TEXT, allowNull: true },
    };

    const options = {
        timestamps: false
    };

    const Category = sequelize.define('category', attributes, options);

    // Define associations
    Category.associate = function(models) {
        // One category can have many campaigns
    Category.hasMany(models.Campaign, { foreignKey: 'Category_ID', as: 'campaigns' });
    };

    return Category;
}

module.exports = model;
