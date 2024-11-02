const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Participant_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Event_ID: { type: DataTypes.INTEGER, allowNull: false },
        joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

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
        },
        acc_pnumber: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_pnumber : null;
            }
        },
        acc_email: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_email : null;
            }
        },
        Event_Name: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.event ? this.event.Event_Name : null;
            }
        },
        Event_Image: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.event ? this.event.Event_Image : null;
            }
        }
    };

    const options = {
        timestamps: false
    };

    const EventParticipant = sequelize.define('EventParticipant', attributes, options);

    // Associate EventParticipant with Account
    EventParticipant.associate = function(models) {
        EventParticipant.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });
        EventParticipant.belongsTo(models.Event, { foreignKey: 'Event_ID', as: 'event' });


    };

    return EventParticipant;
}

module.exports = model;


