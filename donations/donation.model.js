const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        donation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        acc_id: { type: DataTypes.INTEGER, allowNull: false },
        campaign_id: { type: DataTypes.INTEGER, allowNull: false },
        donation_amount: { type: DataTypes.FLOAT, allowNull: false },
        donation_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        fee_amount: { type: DataTypes.FLOAT, allowNull: true }, 


        // Virtual fields to fetch associated account and campaign data
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
        Campaign_Name: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.campaign ? this.campaign.Campaign_Name : null;
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

    const Donation = sequelize.define('Donation', attributes, options);

    // Define associations
    Donation.associate = function(models) {
        Donation.belongsTo(models.Account, { foreignKey: 'acc_id', as: 'account' });
        Donation.belongsTo(models.Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
    };

    return Donation;
}
