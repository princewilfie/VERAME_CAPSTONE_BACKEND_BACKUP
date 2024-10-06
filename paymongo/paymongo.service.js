const axios = require('axios');

const PAYMONGO_SECRET_KEY = 'sk_test_your_secret_key';  // Use your actual secret key

exports.createPaymentIntent = async function(amount) {
    try {
        const response = await axios.post('https://api.paymongo.com/v1/payment_intents', {
            data: {
                attributes: {
                    amount: amount * 100, // Converting to centavos
                    payment_method_allowed: ['gcash'],
                    currency: 'PHP',
                },
            },
        }, {
            headers: {
                Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error from PayMongo API: ${error.response ? error.response.data : error.message}`);
    }
};
