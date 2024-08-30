const config = require('config.json');
const db = require('_helpers/db');
const Role = require('_helpers/role');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('_helpers/send-email');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function authenticate({ acc_email, acc_passwordHash, ipAddress }) {
    const account = await db.Account.scope('withHash').findOne({ where: { acc_email } });

    if (!account || !(await bcrypt.compare(acc_passwordHash, account.acc_passwordHash))){ 
        throw 'Email or password is incorrect';
    }

    // Authentication successful
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    // Save refresh token
    await refreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const account = await refreshToken.getAccount();

    // Replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // Generate new JWT token
    const jwtToken = generateJwtToken(account);

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    // Validate
    if (await db.Account.findOne({ where: { acc_email: params.acc_email } })) {
        // Send already registered error in email to prevent account enumeration
        return await sendAlreadyRegisteredEmail(params.acc_email, origin);
    }

    // Create account object
    const account = new db.Account(params);

    // First registered account is an admin
    const isFirstAccount = (await db.Account.count()) === 0;
    account.acc_role = isFirstAccount ? Role.Admin : Role.User;
    account.acc_verificationToken = randomTokenString();

    // Hash password
    account.acc_passwordHash = await bcrypt.hash(params.acc_passwordHash, 10);

    // Save account
    await account.save();

    // Send verification email
    await sendVerificationEmail(account, origin);
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/login`;
        message = `<p>The email <strong>${email}</strong> is already registered. Please <a href="${verifyUrl}">login</a>.</p>`;
    } else {
        message = `<p>The email <strong>${email}</strong> is already registered. Please login using your existing account.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Email Already Registered',
        html: `<h4>Email Already Registered</h4>${message}`
    });
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ where: { acc_verificationToken: token } });

    if (!account) throw 'Verification failed';

    account.acc_verified = Date.now();
    account.acc_verificationToken = null;
    await account.save();
}

async function forgotPassword({ acc_email }, origin) {
    const account = await db.Account.findOne({ where: { acc_email } });

    // Always return ok response to prevent email enumeration
    if (!account) return;

    // Create reset token
    account.acc_resetToken = crypto.randomBytes(40).toString('hex');
    account.acc_resetTokenExpires = new Date(Date.now() + 24*60*60*1000); // 24 hours

    await account.save();

    // Send email
    sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [db.Sequelize.Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';
}

async function resetPassword({ token, acc_passwordHash }) {
    const account = await db.Account.findOne({
        where: {
            acc_resetToken: token,
            acc_resetTokenExpires: { [db.Sequelize.Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';

    // Update password and remove reset token
    account.acc_passwordHash = bcrypt.hashSync(acc_passwordHash, 10);
    account.acc_resetToken = null;
    account.acc_resetTokenExpires = null;
    await account.save();
}

function getAll() {
    return db.Account.findAll();
}


async function getById(id) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    // Validate
    if (await db.Account.findOne({ where: { acc_email: params.acc_email } })) {
        throw 'Email "' + params.acc_email + '" is already registered';
    }

    const account = new db.Account(params);

    // Hash password
    if (params.acc_passwordHash) {
        account.acc_passwordHash = bcrypt.hashSync(params.acc_passwordHash, 10);
    }

    // Save account
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    const account = await getAccount(id);

    // Validate
    const emailChanged = params.acc_email && account.acc_email !== params.acc_email;
    if (emailChanged && await db.Account.findOne({ where: { acc_email: params.acc_email } })) {
        throw 'Email "' + params.acc_email + '" is already registered';
    }

    // Hash password if it was entered
    if (params.acc_passwordHash) {
        params.acc_passwordHash = bcrypt.hashSync(params.acc_passwordHash, 10);
    }

    // Copy params to account and save
    Object.assign(account, params);
    await account.save();

    return basicDetails(account);
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.destroy();
}

// Helper functions

async function getAccount(id) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function generateJwtToken(account) {
    // Create a JWT token containing the account ID
    return jwt.sign({ sub: account.id, id: account.id }, config.secret, { expiresIn: '15m' });
}

function generateRefreshToken(account, ipAddress) {
    // Create a refresh token that expires in 7 days
    return new db.RefreshToken({
        accountId: account.id,
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });
}

function sendVerificationEmail(account, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/verify-email?token=${account.acc_verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> API route:</p>
                   <p><code>${account.acc_verificationToken}</code></p>`;
    }

    sendEmail({
        to: account.acc_email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`
    });
}

function sendPasswordResetEmail(account, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${account.acc_resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 24 hours:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> API route:</p>
                   <p><code>${account.acc_resetToken}</code></p>`;
    }

    sendEmail({
        to: account.acc_email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password</h4>
               ${message}`
    });
}

function basicDetails(account) {
    const { acc_id, acc_email, acc_role, acc_created, acc_updated, acc_verified } = account;
    return { acc_id, acc_email, acc_role, acc_created, acc_updated, acc_verified };
}
