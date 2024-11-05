const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Category_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Category_Name: { type: DataTypes.STRING, allowNull: false, unique: true },
    };

    const options = {
        timestamps: false,
    };

    const Category = sequelize.define('category', attributes, options);
    return Category;
}

module.exports = model;
