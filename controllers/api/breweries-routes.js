const router = require('express').Router();
const { Breweries, User } = require('../../models');
const withAuth = require('../../utils/auth');

// GET all breweries
router.get('/', withAuth, async (req, res) => {
  try {
    const brewData = await Breweries.findAll({
      include: [
        {
          model: User,
        },
      ],
      where: {
        user_id: req.session.user_id,
      },
    });

    const breweries = brewData.map((brewery) => brewery.get({ plain: true }));
    //res.json(breweries);
    res.render('mypubs', {
      breweries,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET one breweries
router.get('/singlebrewery/:id', async (req, res) => {
  try {
    const brewData = await Breweries.findByPk(req.params.id, {
      include: [
        {
          model: User,
        },
      ],
    });

    if (!brewData) {
      return res.status(404).json({ message: 'No brewery found with that id!' });
    }

    const brewery = brewData.get({ plain: true });
    //res.json(brewery);
    res.render('mypubscomment', {
      brewery,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/addbrewery/', withAuth, async (req, res) => {
  try {
    const dbbrewData = await Breweries.create({
      refid: req.body.refid,
      name: req.body.brewname,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.zipcode,
      phone: req.body.phone,
      website: req.body.website,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      remark: req.body.remark,
      comments: req.body.comment,
      created_date: req.body.currentDate,
      user_id: req.session.user_id,
    });
    res.status(200).json(dbbrewData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Updates breweries comment on its id
router.put('/:id', withAuth, (req, res) => {
  //Calls the update method on the Book model
  Breweries.update(
    {
      comments: req.body.comment,
    },
    {
      where: {
        id: req.params.id,
      },
    }
  )
    .then(([affectedRows]) => {
      if (!affectedRows) {
        return res.status(404).json({ message: 'No brewery found with that id!' });
      }

      return res.status(200).json({ message: 'Comment updated', affectedRows });
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

router.delete('/:id', withAuth, async (req, res) => {
  try {
    const brewData = await Breweries.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!brewData) {
      res.status(404).json({ message: 'No brewery found with that id!' });
      return;
    }

    res.status(200).json(brewData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
