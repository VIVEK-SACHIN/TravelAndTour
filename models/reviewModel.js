const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    CreatedAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'a review must have a user who have written it']
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'a review must have a tour about which review is ']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  // next();
  //commenting above code to avoid populte chain that is populating one feild inside another and in that feild also populating something
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
