// const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setUserIdAndTourId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find(filterObj);
//   res
//     .status(200)
//     .json({ status: 'sucess', results: reviews.length, data: { reviews } }); //whenever sending an array of data send data inside data object an mention the no of items
// });
// exports.createReview = catchAsync(async (req, res, next) => {
//   const review = await Review.create(req.body);
//   res.status(200).json({ status: 'sucess', data: { review } });
// });
