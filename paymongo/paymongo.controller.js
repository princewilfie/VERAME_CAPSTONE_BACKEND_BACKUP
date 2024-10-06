const paymongoService = require('../paymongo/paymongo.service'); // Correct relative path

exports.handleCreatePaymentIntent = async (req, res) => {
    const { amount } = req.body;
    try {
        const paymentIntent = await paymongoService.createPaymentIntent(amount);
        res.status(200).json({ source_url: paymentIntent.data.attributes.next_action.redirect.url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
