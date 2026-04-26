const { getPayments, createPayment } = require('../models/paymentModel');

async function getPaymentsHandler(req, res) {
    try {
        const payments = await getPayments();
        res.json(payments);
    } catch (err) {
        console.error('Payment fetch error:', err);
        res.status(500).json({ error: 'Failed to load payments' });
    }
}

async function createPaymentHandler(req, res) {
    try {
        const payment = await createPayment(req.body);
        res.status(201).json(payment);
    } catch (err) {
        console.error('Payment create error:', err);
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    getPaymentsHandler,
    createPaymentHandler
};
