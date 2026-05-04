const { getPayments, createPayment, getPendingPayments, getRevenueReport, getAllSubscriptions } = require('../models/paymentModel');

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

async function getPendingPaymentsHandler(req, res) {
    try {
        const pendingPayments = await getPendingPayments();
        res.json(pendingPayments);
    } catch (err) {
        console.error('Pending payments fetch error:', err);
        res.status(500).json({ error: 'Failed to load pending payments' });
    }
}

async function getRevenueReportHandler(req, res) {
    try {
        const report = await getRevenueReport();
        res.json(report);
    } catch (err) {
        console.error('Revenue report error:', err);
        res.status(500).json({ error: 'Failed to load revenue report' });
    }
}

async function getAllSubscriptionsHandler(req, res) {
    try {
        const subscriptions = await getAllSubscriptions();
        res.json(subscriptions);
    } catch (err) {
        console.error('Subscriptions fetch error:', err);
        res.status(500).json({ error: 'Failed to load subscriptions' });
    }
}

module.exports = {
    getPaymentsHandler,
    createPaymentHandler,
    getPendingPaymentsHandler,
    getRevenueReportHandler,
    getAllSubscriptionsHandler
};
