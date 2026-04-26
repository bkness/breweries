const path = require('path');
const express = require('express');
// Import express-session
const session = require('express-session');
const exphbs = require('express-handlebars');
const helpers = require('./utils/helpers');
const routes = require('./controllers');
const sequelize = require('./config/connection');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const app = express();
const PORT = process.env.PORT || 3001;

const hbs = exphbs.create({ helpers });

// Set up sessions
const sess = {
  secret: process.env.SESSION_SECRET || 'localbrew',
  cookie: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  },
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({
    db: sequelize,
  }),
};

app.use(session(sess));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.logged_in = req.session.logged_in;
  res.locals.username = req.session.username;
  next();
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Now listening'));
});
