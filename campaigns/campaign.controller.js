const express = require('express');
const router = express.Router();
const multer = require('_middleware/multer-config');
const validateRequest = require('_middleware/validate-request');
const Joi = require('joi');
const campaignService = require('./campaign.service');
const authorize = require('_middleware/authorize');
const paymongoService = require('../paymongo/paymongo.service');


// File upload for creating campaigns
router.post('/', multer.fields([
    { name: 'Campaign_Image', maxCount: 1 },
    { name: 'Proof_Files', maxCount: 10 } // Adjust maxCount as necessary
]), (req, res, next) => {
    // Check if Campaign_Image is uploaded
    if (!req.files || !req.files.Campaign_Image) {
        return res.status(400).send('No campaign image uploaded.');
    }
    createSchema(req, res, next);
}, create);

router.get('/approved', getAllApproved); 

// Get all approved campaigns
router.get('/', getAll);

// Get approved campaign by ID
router.get('/:id', getById);

// Get campaigns by account ID
router.get('/account/:id', getByAccountId);

// File upload for updating campaigns
router.put('/:id', multer.fields([
    { name: 'Campaign_Image', maxCount: 1 },
    { name: 'Proof_Files', maxCount: 10 }
]), (req, res, next) => {
    // Files are optional in update, no need to check
    updateSchema(req, res, next);
}, update);

// Approve a campaign (only accessible by admin)
router.put('/:id/approve', authorize('Admin'), approve);

// Reject a campaign (only accessible by admin)
router.put('/:id/reject', authorize('Admin'), reject);

// Delete a campaign
router.delete('/:id', _delete);

router.get('/:id/proofs', authorize('Admin'), getProofFiles);
router.get('/:id/notes', authorize('Admin'), getNotes);


router.post('/:id/donate', async (req, res, next) => {
    const { amount } = req.body;
    try {
        const campaign = await campaignService.getById(req.params.id); // Fetch the campaign
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

        // Create payment intent using PayMongo service
        const paymentIntent = await paymongoService.createPaymentIntent(amount);
        res.status(200).json({ 
            message: 'Payment intent created',
            source_url: paymentIntent.data.attributes.next_action.redirect.url
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

// Function to approve a campaign
function approve(req, res, next) {
    campaignService.approve(req.params.id)
        .then(campaign => res.json(campaign))
        .catch(next);
}

// Function to reject a campaign
function reject(req, res, next) {
    const adminNotes = req.body.Admin_Notes; // Extract admin notes from the request body
    campaignService.reject(req.params.id, adminNotes)
        .then(campaign => res.json(campaign))
        .catch(next);
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        Acc_ID: Joi.number().required(),
        Campaign_Name: Joi.string().required(),
        Campaign_Description: Joi.string().required(),
        Campaign_TargetFund: Joi.number().required(),
        Campaign_Start: Joi.date().required(),
        Campaign_End: Joi.date().required(),
        Campaign_Status: Joi.number().required(),
        Category_ID: Joi.string().required(), 
        Campaign_Notes: Joi.string().required()

    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    console.log('Files:', req.files); // Log files to verify
    const campaignImage = req.files.Campaign_Image ? req.files.Campaign_Image[0] : null;

    // Ensure proofFiles is always an array
    const proofFiles = req.files.Proof_Files 
        ? (Array.isArray(req.files.Proof_Files) ? req.files.Proof_Files : [req.files.Proof_Files])
        : [];

    const campaignEndDate = new Date(req.body.Campaign_End);
    const currentDate = new Date();

    // Check if the campaign end date is before the current date
    if (currentDate > campaignEndDate) {
        return res.status(400).json({ message: 'Campaign end date has passed. Cannot create campaign.' });
    }

    campaignService.create(req.body, campaignImage, proofFiles)
        .then(campaign => res.json(campaign))
        .catch(next);
}



function getAll(req, res, next) {
    campaignService.getAll()
        .then(campaigns => res.json(campaigns))
        .catch(next);
}

function getById(req, res, next) {
    campaignService.getById(req.params.id)
        .then(campaign => res.json(campaign))
        .catch(next);
}

function getByAccountId(req, res, next) {
    campaignService.getByAccountId(req.params.id)
        .then(campaigns => res.json(campaigns))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        Campaign_Name: Joi.string().empty(''),
        Campaign_Description: Joi.string().empty(''),
        Campaign_TargetFund: Joi.number().empty(''),
        Campaign_Start: Joi.date().empty(''),
        Campaign_End: Joi.date().empty(''),
        Category_ID: Joi.string().empty(''),
        Campaign_Notes: Joi.string().empty('')

    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    console.log('Files:', req.files); // Log files to verify
    const campaignImage = req.files.Campaign_Image ? req.files.Campaign_Image[0] : null;

    // Ensure proofFiles is always an array
    const proofFiles = req.files.Proof_Files 
        ? (Array.isArray(req.files.Proof_Files) ? req.files.Proof_Files.map(file => file.path) : [req.files.Proof_Files.path])
        : [];

    const campaignEndDate = new Date(req.body.Campaign_End);
    const currentDate = new Date();

    // Check if the campaign end date is before the current date
    if (currentDate > campaignEndDate) {
        return res.status(400).json({ message: 'Campaign end date has passed. Cannot update campaign.' });
    }

    // Automatically set status and approval fields
    req.body.Campaign_Status = 0;  // Set to 'Pending'
    req.body.Campaign_ApprovalStatus = 'Waiting For Approval';

    campaignService.update(req.params.id, req.body, campaignImage, proofFiles)
        .then(campaign => res.json(campaign))
        .catch(next);
}



function _delete(req, res, next) {
    campaignService._delete(req.params.id)
        .then(() => res.json({ message: 'Campaign deleted successfully' }))
        .catch(next);
}

function getProofFiles(req, res, next) {
    campaignService.getProofFiles(req.params.id)
        .then(proofFiles => res.json({ proofFiles }))
        .catch(next);
}

function getNotes(req, res, next) {
    campaignService.getNotes(req.params.id)
        .then(notes => res.json({ notes }))
        .catch(next);
}

function getAllApproved(req, res, next) {
    campaignService.getAllApproved()  // Changed from getAll to getAllApproved
        .then(campaigns => res.json(campaigns))
        .catch(next);
}