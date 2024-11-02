const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Event_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
        Event_Name: { type: DataTypes.STRING, allowNull: false },
        Event_Description: { type: DataTypes.TEXT, allowNull: false },
        Event_Start_Date: { type: DataTypes.DATE, allowNull: false },
        Event_End_Date: { type: DataTypes.DATE, allowNull: false },
        Event_Location: { type: DataTypes.STRING, allowNull: false },
        Event_Status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
        Event_Image: { type: DataTypes.STRING, allowNull: true },
        Event_ApprovalStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },


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
        acc_email: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.account ? this.account.acc_email : null;
            }
        }

    };

    const options = {
        timestamps: false
    };

    const Event = sequelize.define('Event', attributes, options);

    // Define associations
    Event.associate = function(models) {
        Event.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });
    };

    return Event;
}

module.exports = model;