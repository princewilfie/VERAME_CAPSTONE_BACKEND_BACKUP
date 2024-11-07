const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Comment_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Event_ID: { type: DataTypes.INTEGER, allowNull: false },
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

    const EventComment = sequelize.define('EventComment', attributes, options);

    // Associate EventComment with Account and Event
    EventComment.associate = function(models) {
        EventComment.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });
        EventComment.belongsTo(models.Event, { foreignKey: 'Event_ID' });
    };

    return EventComment;
}

module.exports = model;
