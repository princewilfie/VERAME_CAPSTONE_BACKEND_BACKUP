const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Withdraw_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Campaign_ID: { type: DataTypes.INTEGER, allowNull: false },
        acc_id: { type: DataTypes.INTEGER, allowNull: false },
        Acc_number: { type: DataTypes.STRING, allowNull: false },  
        Bank_account: { type: DataTypes.STRING, allowNull: false },  
        Withdraw_Amount: { type: DataTypes.FLOAT, allowNull: false },
        Status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },
        Request_Date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        Testimony: { type: DataTypes.STRING, allowNull: true },  

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

    const Withdraw = sequelize.define('Withdraw', attributes, options);

    // Define associations
    Withdraw.associate = function(models) {
        Withdraw.belongsTo(models.Account, { foreignKey: 'acc_id', as: 'account' });
        Withdraw.belongsTo(models.Campaign, { foreignKey: 'Campaign_ID', as: 'campaign' }); // Associating with Campaign
    };

    return Withdraw;
}

module.exports = model;