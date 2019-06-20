const session        = require('express-session');
const mongo          = require('mongodb').MongoClient;
const passport       = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, db) {
  
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({id: id},(err, doc) => {
      done(null, doc);
    });
  });

  var colors = [ '#ff3e30','#ff6f5f','#ff6aaf','#9f3985','#2ecd40','#ff650f','#0074e9','#39cccd','#ff9a0c' ];
  var rand = Math.floor((Math.random() * colors.length) + 1); 
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://glaze-kitchen.glitch.me/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
      db.collection('users').findOneAndUpdate({id: profile.id},
        {$setOnInsert:{
          id: profile.id,
          username: profile.username,
          color: colors[rand],
          name: profile.displayName || 'Anonymous',
          photo: profile.photos[0].value || '',
          email: profile.emails[0].value || 'No public email',
          created_on: new Date(),
          friends: [],
          messages: [],
          socket_id: '',
          chat_messages: 0
        },$set:{ last_login: new Date() },$inc:{ login_count: 1 }},{upsert: true, returnOriginal: false}, (err, doc) => {
          return cb(null, doc.value);
      });
    }
  ));
}