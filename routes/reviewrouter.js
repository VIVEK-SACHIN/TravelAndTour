const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
router.use(authController.protect);
router
  .route('/')
  .get(
    authController.protect,
    reviewController.setUserIdAndTourId,
    reviewController.getAllReviews
  )
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setUserIdAndTourId,
    reviewController.createReview
  );
router
  .route('/:id')
  .patch(
    reviewController.setUserIdAndTourId,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    reviewController.deleteReview,
    authController.restrictTo('user', 'admin')
  )
  .get(reviewController.getReview);
module.exports = router;
