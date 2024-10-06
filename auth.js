const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: '344605713356-ctgu2dlpij9k57ff5eoi1o8nr0qd4vt6.apps.googleusercontent.com',
    clientSecret: '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',
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
  return jwt.sign({ id: user.id, email: user.emails[0].value }, 'your_jwt_secret', { expiresIn: '1h' });
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
