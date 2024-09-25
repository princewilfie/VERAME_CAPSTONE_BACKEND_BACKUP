require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');
const path = require('path'); 



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// api routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/campaigns', require('./campaigns/campaign.controller'));
app.use('/donation', require('./donations/donation.controller'));




// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

//global error handler
app.use(errorHandler);

app.use('/assets', express.static(path.join(__dirname, 'assets')));



// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));


app.post('/logout', async (req, res) => {
    try {
        const token = req.body.token; // Get the token from the request body
        const ipAddress = req.ip; // Get the user's IP address
        await revokeToken({ token, ipAddress }); // Call the revokeToken function
        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});
