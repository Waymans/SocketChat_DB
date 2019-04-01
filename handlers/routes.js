const passport    = require('passport');

module.exports = function (app, db) {
  
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };
  
  // login auth
  app.route('/login/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
      req.session.user_id = req.user.id;
      res.redirect('/');
    });
  
  // homepage
  app.route('/')
    .get((req, res) => {
      res.render('index', { user: req.user });
    });

  // logout
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  // error
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}