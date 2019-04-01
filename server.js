const express          = require('express');
const app              = express();
const http             = require('http').Server(app);
const io               = require('socket.io')(http); 
const MongoClient      = require('mongodb').MongoClient;
const passport         = require('passport');
const cookieParser     = require('cookie-parser');
const session          = require('express-session');
const sessionStore     = new session.MemoryStore();
const passportSocketIo = require('passport.socketio');
const Strategy         = require('passport-github').Strategy;
const routes           = require('./handlers/routes.js');
const auth             = require('./handlers/auth.js');
const bodyParser       = require('body-parser');
const helmet           = require('helmet');
const uri              = process.env.MONGO_URI;

app.use(express.static(process.cwd() + '/public'));
app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore,
}));

/* DB code */
let db;
MongoClient.connect(uri, { useNewUrlParser: true })
.then(client => {
  db = client.db('url-toshorturl-db');
  auth(app, db);
  routes(app, db);
  console.log("Connected successfully to server");
}).catch(error => console.error(error));

/* socket code */
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore
}));

var currentUsers = 0; //dont need
var currentList = [];
io.on('connection', function(socket){
  var user = socket.request.user;
  var userName = user.username;
  var userColor = user.color;
  var userId; // for disconnect
  var colorU; // for disconnect
  var nameU; // for disconnect
  var addedUser = true;
  
  db.collection('users').findOneAndUpdate({username: userName}, {$set: {socket_id: socket.id} }, {returnNewDocument: true}, (err, res) => {
    if (err) throw err;
    userId = res.value.socket_id;
    colorU = res.value.color;
    currentList.push(res.value);
    ++currentUsers; // dont need
    io.emit('new user', { name: userName, color: userColor }); // could combine these
    io.emit('count', { count: currentUsers });
    io.emit('users', { users: currentList });
  }); 
  
  
  socket.on('chat message', function(msg, color){
    socket.broadcast.emit('chat message', { msg: msg, name: userName, color: color});
  });  
  
  socket.on('typing', function(color){
	  socket.broadcast.emit('typing', { name: userName, color: color });
  });
  
  socket.on('not typing', function(data){
	  socket.broadcast.emit('not typing');
  });
  
  socket.on('private message', function(msg, name){ 
    var id = currentList[currentList.findIndex(i => i.username === name)].socket_id;
    io.to(id).emit('private message', { name: userName, color: userColor, msg: msg });
  });

  socket.on('disconnect', function(socket){
    if (addedUser) {
      currentList.splice(currentList.findIndex(i => i.id === userId), 1);
      --currentUsers; // dont need
      io.emit('disconnect', { name: nameU, color: colorU, count: currentUsers });
      io.emit('users', { users: currentList });
    }
  });
});

const listener = http.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});