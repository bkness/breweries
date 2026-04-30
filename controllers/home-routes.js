const router = require('express').Router();
const { Breweries } = require('../models');

router.get('/', async (req, res) => {
  try {
    let savedIds = [];
    if (req.session.logged_in && req.session.user_id) {
      const savedBreweries = await Breweries.findAll({
        attributes: ['refid'],
        where: { user_id: req.session.user_id },
      });
      savedIds = savedBreweries.map((brewery) => brewery.refid);
    }

    const breweryData = await fetch('https://api.openbrewerydb.org/v1/breweries?by_city=phoenix');
    const apiData = await breweryData.json();

    res.render('homepage', {
      apiData,
      savedIds,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/search', async (req, res) => {
  try {
    const { city, state, name } = req.query;
    let savedIds = [];

    if (req.session.logged_in && req.session.user_id) {
      const savedBreweries = await Breweries.findAll({
        attributes: ['refid'],
        where: { user_id: req.session.user_id },
      });
      savedIds = savedBreweries.map((brewery) => brewery.refid);
    }

    let query = 'https://api.openbrewerydb.org/v1/breweries?';

    if (city) query += `by_city=${encodeURIComponent(city)}&`;
    if (state) query += `by_state=${encodeURIComponent(state)}&`;
    if (name) query += `by_name=${encodeURIComponent(name)}&`;

    const response = await fetch(query);
    const apiData = await response.json();

    res.render('homepage', {
      apiData,
      savedIds,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/login', (req, res) => {
  if (req.session.logged_in) {
    res.redirect('/');
    return;
  }
  res.render('login');
});

module.exports = router;
