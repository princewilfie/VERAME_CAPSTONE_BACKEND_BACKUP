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

router.get('/all', authorize('Admin'), getAll); // Only admin can view all withdrawals

router.put('/submit-testimony', authorize(), submitTestimony);


// Function to request a withdrawal
function requestWithdrawal(req, res, next) {
    const { Campaign_ID, acc_id, Acc_number, Bank_account } = req.body; // Include new fields

    // Validate that Campaign_ID, acc_id, Acc_number, and Bank_account are provided
    if (!Campaign_ID || !acc_id || !Acc_number || !Bank_account) {
        return res.status(400).json({ message: 'Campaign ID, Account ID, Account Number, and Bank Account are required' });
    }

    withdrawService.requestWithdrawal(Campaign_ID, acc_id, Acc_number, Bank_account) // Pass new fields
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

function getAll(req, res, next) {
    withdrawService.getAll()
        .then(withdrawals => res.json(withdrawals))
        .catch(next);
}

function submitTestimony(req, res, next) {
    const { Withdraw_ID, testimony } = req.body;  // Get Withdraw_ID and Testimony from request body

    // Validate that Withdraw_ID and Testimony are provided
    if (!Withdraw_ID || !testimony) {
        return res.status(400).json({ message: 'Withdraw ID and testimony are required' });
    }

    withdrawService.submitTestimony(Withdraw_ID, testimony)  // Pass to the service
        .then(withdrawal => res.json(withdrawal))
        .catch(next);
}

module.exports = router;