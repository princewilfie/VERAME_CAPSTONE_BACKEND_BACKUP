const express = require('express');
const router = express.Router();
const withdrawService = require('./withdraw.service');
const authorize = require('_middleware/authorize');

// Route to request a full withdrawal for a campaign
router.post('/request', authorize(), requestWithdrawal);

// Route to approve a withdrawal (admin only)
router.put('/approve', authorize('Admin'), approveWithdrawal); // Changed to use body

// Route to reject a withdrawal (admin only)
router.put('/reject', authorize('Admin'), rejectWithdrawal); // Changed to use body

// Function to request a withdrawal
function requestWithdrawal(req, res, next) {
    const { Campaign_ID, acc_id } = req.body; // Get acc_id from the request body

    // Validate that both Campaign_ID and acc_id are provided
    if (!Campaign_ID || !acc_id) {
        return res.status(400).json({ message: 'Campaign ID and Account ID are required' });
    }

    withdrawService.requestWithdrawal(Campaign_ID, acc_id)  // Pass acc_id from the request body
        .then(withdrawal => res.json(withdrawal))
        .catch(next);
}

// Function to approve a withdrawal
function approveWithdrawal(req, res, next) {
    const { Withdraw_ID } = req.body; // Get Withdraw_ID from the request body

    // Validate that Withdraw_ID is provided
    if (!Withdraw_ID) {
        return res.status(400).json({ message: 'Withdraw ID is required' });
    }

    withdrawService.approveWithdrawal(Withdraw_ID) // Pass Withdraw_ID from the body
        .then(withdrawal => res.json(withdrawal))
        .catch(next);
}

// Function to reject a withdrawal
function rejectWithdrawal(req, res, next) {
    const { Withdraw_ID } = req.body; // Get Withdraw_ID from the request body

    // Validate that Withdraw_ID is provided
    if (!Withdraw_ID) {
        return res.status(400).json({ message: 'Withdraw ID is required' });
    }

    withdrawService.rejectWithdrawal(Withdraw_ID) // Pass Withdraw_ID from the body
        .then(withdrawal => res.json(withdrawal))
        .catch(next);
}

module.exports = router;
