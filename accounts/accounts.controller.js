const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('_middleware/multer-config'); // Assuming multer is configured correctly here
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const accountService = require('./account.service');

// Route Definitions
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', multer.single('acc_image'), registerSchema, register); // Updated to include image upload
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

module.exports = router;

// Function Definitions
function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        acc_email: Joi.string().required(),
        acc_passwordHash: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    const { acc_email, acc_passwordHash } = req.body;
    const ipAddress = req.ip;

    accountService.authenticate({ acc_email, acc_passwordHash, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function refreshToken(req, res, next) {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    accountService.refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        })
        .catch(next);
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
    const { token } = req.body;
    const ipAddress = req.ip;
    accountService.revokeToken({ token, ipAddress })
        .then(() => {
            res.json({ message: 'Token revoked' });
        })
        .catch(next);
}

function setTokenCookie(res, token) {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        acc_email: Joi.string().email().required(),
        acc_passwordHash: Joi.string().min(6).required(),
        acc_firstname: Joi.string().required(),
        acc_lastname: Joi.string().required(),
        acc_pnumber: Joi.string().required(),
        confirmPassword: Joi.string().valid(Joi.ref('acc_passwordHash')).required(),
        acc_acceptTerms: Joi.boolean().valid(true).required()
        
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    // Access file information from req.file
    const { acc_email, acc_passwordHash, acc_firstname, acc_lastname, acc_pnumber, acc_totalpoints, acc_role } = req.body;
    const acc_image = req.file ? req.file.path : null; // Default to null if no image uploaded

    const body = { acc_email, acc_passwordHash, acc_firstname, acc_lastname, acc_pnumber, acc_totalpoints, acc_role, acc_image };

    accountService.register(body, req.get('origin'))
        .then(() => {
            res.json({ message: 'Registration successful, please check your email for verification instructions' });
        })
        .catch(next);
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
    accountService.verifyEmail(req.body)
        .then(() => {
            res.json({ message: 'Verification successful, you can now log in' });
        })
        .catch(next);
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        acc_email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
    accountService.forgotPassword(req.body, req.get('origin'))
        .then(() => {
            res.json({ message: 'Please check your email for password reset instructions' });
        })
        .catch(next);
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
    accountService.validateResetToken(req.body)
        .then(() => {
            res.json({ message: 'Token is valid' });
        })
        .catch(next);
}

function resetPasswordSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
        acc_passwordHash: Joi.string().min(6).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
    accountService.resetPassword(req.body)
        .then(() => {
            res.json({ message: 'Password reset successful, you can now log in' });
        })
        .catch(next);
}

function getAll(req, res, next) {
    accountService.getAll()
        .then(accounts => {
            res.json(accounts);
        })
        .catch(next);
}

function getById(req, res, next) {
    accountService.getById(req.params.id)
        .then(account => {
            res.json(account);
        })
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        acc_email: Joi.string().email().required(),
        acc_firstname: Joi.string().required(),
        acc_lastname: Joi.string().required(),
        acc_passwordHash: Joi.string().min(6).required(),
        acc_pnumber: Joi.string().required(),
        confirmPassword: Joi.string().valid(Joi.ref('acc_passwordHash')).required(),
        role: Joi.string().valid(Role.Admin, Role.User).required()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    accountService.create(req.body)
        .then(account => {
            res.json(account);
        })
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        acc_email: Joi.string().email().empty(''),
        acc_firstname: Joi.string().empty(''),
        acc_lastname: Joi.string().empty(''),
        acc_passwordHash: Joi.string().min(6).empty(''),
        acc_pnumber: Joi.string().empty(''),
        acc_image: Joi.string().uri().empty(''),
        acc_totalpoints: Joi.number().empty(''),
        acc_role: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    accountService.update(req.params.id, req.body)
        .then(account => {
            res.json(account);
        })
        .catch(next);
}

function _delete(req, res, next) {
    accountService.delete(req.params.id)
        .then(() => {
            res.json({ message: 'Account deleted successfully' });
        })
        .catch(next);
}
