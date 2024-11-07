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



const passport = require('passport');
const session = require('express-session');

// Session setup for Passport.js
app.use(session({
    secret: 'kjhr3vi3nvw39y2394n23219o13241f',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Import Google OAuth routes from auth.js
const { setupGoogleAuthRoutes } = require('./auth');
setupGoogleAuthRoutes(app); // Setup Google OAuth routes


// Paymongo routes
const paymongoRoutes = require('./paymongo/paymongo.routes');
app.use('/paymongo', paymongoRoutes);

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));




// api routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/campaigns', require('./campaigns/campaign.controller'));
app.use('/donation', require('./donations/donation.controller'));
app.use('/rewards', require('./rewards/reward.controller'));
app.use('/events', require('./events/event.controller')); 
app.use('/redeemReward', require('./redeemReward/redeemReward.controller'));
app.use('/eventParticipant', require('./eventParticipant/eventParticipant.controller'));
app.use('/comment', require('./comment/comments.controller')); // Separate comments route
app.use('/like', require('./like/likes.controller')); // Add like route
app.use('/category', require('./category/category.controller'));
app.use('/Revenue', require('./Revenue/revenue.controller'));




// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

//global error handler
app.use(errorHandler);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/uploads', express.static('uploads'));

app.use('/withdraw', require('./withdraw/withdraw.controller'));

app.use('/eventLike', require('./eventLike/eventLike.controller'));

app.use('/eventComment', require('./eventComment/eventComment.controller'));



// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));





