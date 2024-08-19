const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        acc_email: { type: DataTypes.STRING, allowNull: false, unique: true },
        acc_passwordHash: { type: DataTypes.STRING, allowNull: false },
        acc_firstname: { type: DataTypes.STRING, allowNull: false },
        acc_lastname: { type: DataTypes.STRING, allowNull: false },
        acc_pnumber: { type: DataTypes.STRING, allowNull: true },
        acc_image: { type: DataTypes.STRING, allowNull: true, defaultValue: 'assets/default-image.png' }, // Set default image path
        acc_totalpoints: { type: DataTypes.STRING, allowNull: true },
        acc_acceptTerms: { type: DataTypes.BOOLEAN },
        acc_role: { type: DataTypes.STRING, allowNull: false },
        acc_verificationToken: { type: DataTypes.STRING },
        acc_verified: { type: DataTypes.DATE },
        acc_resetToken: { type: DataTypes.STRING },
        acc_resetTokenExpires: { type: DataTypes.DATE },
        acc_passwordReset: { type: DataTypes.DATE },
        acc_created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        acc_updated: { type: DataTypes.DATE },
        acc_emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        acc_isVerified: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.acc_emailVerified && this.acc_manualVerificationStatus === 'approved';
            }
        }
    };

    const options = {
        timestamps: false,
        defaultScope: {
            attributes: { exclude: ['acc_passwordHash'] }
        },
        scopes: {
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('account', attributes, options);
}

module.exports = model;
