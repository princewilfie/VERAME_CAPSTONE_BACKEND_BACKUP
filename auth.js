const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();  // Load environment variables from .env file
const jwt = require('jsonwebtoken'); // Assuming you're using this to generate JWTs

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:4200/auth/google/callback',
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Generate JWT token
function generateJWT(user) {
  return jwt.sign({ id: user.id, email: user.emails[0].value }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Define routes for Google OAuth authentication
function setupGoogleAuthRoutes(app) {
  // Route to initiate Google OAuth
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // Callback route once Google has authenticated the user
  app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login-register' // Redirect if authentication fails
  }), (req, res) => {
    const token = generateJWT(req.user); // Generate JWT
    res.redirect(`http://localhost:4200/login-register?token=${token}`); // Redirect to frontend with token
  });

  // Logout route
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
}

module.exports = { setupGoogleAuthRoutes };
