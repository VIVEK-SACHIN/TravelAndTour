const express = require('express');
const tourController = require('./../controllers/tourController');
const authcontroller = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewrouter');

const router = express.Router();

// router.param('id', tourController.checkID);
router.use('/:tourId/review', reviewRouter);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
// router
//   .route('/:tourId/review')
//   .post(
//     authcontroller.protect,
//     authcontroller.restrictTo('user'),
//     reviewController.createReview
//   ); could be confusing and repeative code +

module.exports = router;
