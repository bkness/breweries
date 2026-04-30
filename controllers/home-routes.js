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

    res.render('homepage', {
      apiData: [],
      savedIds,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/search', async (req, res) => {
  try {
    const { city, state, name, page } = req.query;
    const currentPage = Math.max(1, parseInt(page) || 1);
    const perPage = 10;
    let savedIds = [];

    if (req.session.logged_in && req.session.user_id) {
      const savedBreweries = await Breweries.findAll({
        attributes: ['refid'],
        where: { user_id: req.session.user_id },
      });
      savedIds = savedBreweries.map((brewery) => brewery.refid);
    }

    const filters = new URLSearchParams();
    if (city) filters.set('by_city', city);
    if (state) filters.set('by_state', state);
    if (name) filters.set('by_name', name);
    const filterStr = filters.toString();

    const [response, metaResponse] = await Promise.all([
      fetch(`https://api.openbrewerydb.org/v1/breweries?${filterStr}&per_page=${perPage}&page=${currentPage}`),
      fetch(`https://api.openbrewerydb.org/v1/breweries/meta?${filterStr}`),
    ]);

    const apiData = await response.json();
    const meta = await metaResponse.json();
    const totalPages = Math.ceil(parseInt(meta.total) / perPage) || 1;

    const searchParams = new URLSearchParams();
    if (city) searchParams.set('city', city);
    if (state) searchParams.set('state', state);
    if (name) searchParams.set('name', name);
    const searchParamsStr = searchParams.toString();

    res.render('homepage', {
      apiData,
      savedIds,
      logged_in: req.session.logged_in,
      currentPage,
      totalPages,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
      prevPage: currentPage - 1,
      nextPage: currentPage + 1,
      searchParams: searchParamsStr,
      showPagination: totalPages > 1,
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
