const mongoose = require('mongoose');
const Tour = require('./tourModel');

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
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //{ unique: true }
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
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};
reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
//this querry will work for these as well as mongoose internally converts them to findOneAnd..
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //here we are not passing any filter since we are running querry on a querry already containg filter i.e findByIdAndUpdate
  this.r = await this.findOne();
  // to the query we added a variable r that is the querried object.
  // console.log('chur chur naan', this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
  //also this does not have acess to next function
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
