const { DataTypes } = require('sequelize');

function model(sequelize) {
    const attributes = {
        Like_ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        Campaign_ID: { type: DataTypes.INTEGER, allowNull: false },
        Acc_ID: { type: DataTypes.INTEGER, allowNull: false },
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
        }
    };

    const options = {
        timestamps: false  // Disable automatic createdAt and updatedAt fields
    };

    const Like = sequelize.define('Like', attributes, options);

    // Associate Like with Account
    Like.associate = function(models) {
        Like.belongsTo(models.Account, { foreignKey: 'Acc_ID', as: 'account' });
    };

    return Like;
}

module.exports = model;
