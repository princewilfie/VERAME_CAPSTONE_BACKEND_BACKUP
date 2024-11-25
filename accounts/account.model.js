const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        acc_email: { type: DataTypes.STRING, allowNull: false, unique: true },
        acc_passwordHash: { type: DataTypes.STRING, allowNull: false },
        acc_firstname: { type: DataTypes.STRING, allowNull: false },
        acc_lastname: { type: DataTypes.STRING, allowNull: false },
        acc_pnumber: { type: DataTypes.STRING, allowNull: true },
        acc_image: { type: DataTypes.STRING, allowNull: true },
        acc_totalpoints: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
        acc_type: { // New field
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['Donor', 'Beneficiary', 'Admin']],
            }
        },
        acc_acceptTerms: { type: DataTypes.BOOLEAN },
        acc_role: { type: DataTypes.STRING, allowNull: false },
        acc_verificationToken: { type: DataTypes.STRING },
        acc_verified: { type: DataTypes.DATE },
        acc_resetToken: { type: DataTypes.STRING },
        acc_resetTokenExpires: { type: DataTypes.DATE },
        acc_status: { type: DataTypes.STRING, defaultValue: 'Active' },
        acc_passwordReset: { type: DataTypes.DATE },
        acc_created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        acc_updated: { type: DataTypes.DATE },
        acc_emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        acc_isVerified: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.acc_emailVerified && this.acc_manualVerificationStatus === 'approved';
            }
        },

        campaign_name: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.campaigns ? this.campaigns.Campaign_Name : null;
            }
        },

        campaign_currentraised: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.campaigns ? this.campaigns.Campaign_CurrentRaised : null;
            }
        },

        donation_amount: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.donations ? this.donations.donation_amount : null;
            }
        }

    };

    
    const options = {
        timestamps: false,
        defaultScope: {
            attributes: { exclude: ['acc_passwordHash'] }
        },
        scopes: {
            withHash: { attributes: {} },
        }
    };

    const Account = sequelize.define('account', attributes, options);

    // Associations (define the relationships)
    Account.associate = (models) => {
        Account.hasMany(models.Campaign, { foreignKey: 'acc_id', as: 'Campaigns' });
        Account.hasMany(models.Donation, { foreignKey: 'acc_id', as: 'Donations' });
    };

    return Account;
}

module.exports = model;