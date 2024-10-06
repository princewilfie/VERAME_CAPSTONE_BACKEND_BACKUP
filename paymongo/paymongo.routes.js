const express = require('express');
const router = express.Router();
const paymongoController = require('../paymongo/paymongo.controller');

router.post('/create-payment-intent', paymongoController.handleCreatePaymentIntent);

module.exports = router;
