var express = require('express');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
const request = require('request-promise');
var config        = require('./config');

// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: config.facebook.appId,
    clientSecret: config.facebook.appSecret,
    callbackURL: 'http://localhost:3030/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    console.log("the profile is", profile['id'])
    console.log("the accessToken is", accessToken)
    return cb(null, profile);
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Add headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook', {
    scope: ['publish_actions', 'manage_pages', 'user_about_me']
  }));

app.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/myInterest');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

const userFieldSet = 'name, link, is_verified, picture';
const pageFieldSet = 'name, category, link, picture, is_verified';

console.log("the config user access token is", config.user_access_token);

app.get('/myInterest', (req, res) => {

  // you need permission for most of these fields
  const userFieldSet = 'name, \
  music.limit(10){name},\
   movies.limit(10){name},\
   books.limit(10){name},\
   games.limit(10){name},\
   television.limit(10){name}, \
   likes.limit(10){name}';
  console.log("the req params id are", req.params.id);
  const options = {
    method: 'GET',
    uri: `https://graph.facebook.com/v2.9/me/`,
    qs: {
      access_token: config.user_access_token,
      fields: userFieldSet
    }
  };
  request(options)
    .then(fbRes => {
      console.log("the fbRes is", fbRes);
      console.log(typeof(fbRes));
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.parse(fbRes));
    })
})

app.get('/myFriendsInterest', (req, res) => {

  // you need permission for most of these fields
  const userFieldSet = 'name, \
  music.limit(10){name},\
   movies.limit(10){name},\
   books.limit(10){name},\
   games.limit(10){name},\
   television.limit(10){name}, \
   likes.limit(10){name}';
  console.log("the req params id are", req.params.id);
  const options = {
    method: 'GET',
    uri: `https://graph.facebook.com/v2.9/me/`,
    qs: {
      access_token: config.user_access_token,
      fields: "friends.limit(100){name,music.limit(10){name},books.limit(10){name},games.limit(10){name},movies.limit(10){name},likes.limit(10){name}}"
    }
  };
  request(options)
    .then(fbRes => {
      console.log("the fbRes is", fbRes);
      console.log(typeof(fbRes));
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.parse(fbRes));
    })
})

app.listen(3030);
