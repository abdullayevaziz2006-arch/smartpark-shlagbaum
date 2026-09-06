const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/payment/terminal', paymentController.processTerminalPayment);
router.post('/payment/cash', paymentController.processCashPayment);
router.post('/payment/pay', paymentController.processGeneralPayment);

module.exports = router;
