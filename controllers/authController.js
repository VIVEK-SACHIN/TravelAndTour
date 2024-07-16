const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');

const signtoken = id =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    user: req.body.user,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  const token = signtoken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // loging a user is a three step process

  //checking if user exist and password is correct
  if (!email && !password) {
    return next(new AppError('please provide email and password', 400));
  }

  //check if user exists and password is correct .
  const user = User.findOne({ email }).select('+password');
  //to select some feild with select property set as false use this .select('+password')

  if (!user && (await !user.verifyPassord(password, user.password))) {
    return next(AppError('username Or password is incorrect', 401));
  }

  //send the authorized token
  const token = signtoken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
};
