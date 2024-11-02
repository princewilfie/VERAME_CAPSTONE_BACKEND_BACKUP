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
        Request_Date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

        // Virtual fields for associated account
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

    const Withdraw = sequelize.define('Withdraw', attributes, options);

    // Define associations
    Withdraw.associate = function(models) {
        Withdraw.belongsTo(models.Account, { foreignKey: 'acc_id', as: 'account' });
        Withdraw.belongsTo(models.Campaign, { foreignKey: 'Campaign_ID', as: 'campaign' }); // Associating with Campaign
    };

    return Withdraw;
}

module.exports = model;
