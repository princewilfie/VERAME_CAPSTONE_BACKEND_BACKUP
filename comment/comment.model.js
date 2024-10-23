const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Comment_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Campaign_ID: { type: DataTypes.INTEGER, allowNull: false },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Comment_Text: { type: DataTypes.TEXT, allowNull: false },
        Created_At: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

        // Virtual fields to fetch associated account data
        acc_firstname: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_firstname : null;
            }
        },
        acc_lastname: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_lastname : null;
            }
        },
        acc_image: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_image : null;
            }
        }
    };

    const options = {
        timestamps: false
    };

    const Comment = sequelize.define('Comment', attributes, options);

    // Associate Comment with Account
    Comment.associate = function(models) {
        Comment.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });
    };

    return Comment;
}

module.exports = model;
