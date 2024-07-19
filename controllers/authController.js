const jwt = require('jsonwebtoken');
const { promisify } = require('util');
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
    email: req.body.email,
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
    return next(new AppError('username Or password is incorrect', 401));
  }

  //send the authorized token
  const token = signtoken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and cheking of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('you are not logged in ', 401));
  }
  //2)verification of token

  //at third argument this jwt verify takes a callack function which will run in case
  //verification was successful but to go with async await style we would use promisify

  //alternative way
  //const verifyAsync = promisify(jwt.verify);
  //const decoded = await verifyAsync(token, secretKey);

  console.log('pehle');
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decode);

  //3) check if user still exists
  const user = await User.find({ _id: decode.id });
  if (!user.length > 0) {
    return next(
      new AppError('User with the following credentials no longer exists ', 401)
    );
  }
 
  //4)check if user changed password after the token was issued
  if (user[0].changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('After last login password was changed plz login again', 401)
    );
  }

  next();
});

// Sure, let's dive into how jwt.verify works in detail. The jwt.verify method from the jsonwebtoken library is used to verify the authenticity and integrity of a JSON Web Token (JWT). It does this by decoding the token, verifying its signature, and checking its validity against certain criteria (e.g., expiration time, audience).

// JWT Structure
// A JWT consists of three parts separated by dots (.):

// Header: Contains metadata about the token, such as the signing algorithm.
// Payload: Contains the claims or data. This is typically where you put user information.
// Signature: Used to verify that the token has not been tampered with.
// How jwt.verify Works
// Decoding the Token:

// The token is split into its three parts: header, payload, and signature.
// The header and payload are base64 URL-decoded.
// Reconstructing the Signature:

// The library reconstructs the signature by taking the header and payload, concatenating them, and then applying the signing algorithm specified in the header using the secret key or public key.
// Verifying the Signature:

// The reconstructed signature is compared with the signature part of the token. If they match, it means the token is valid and has not been altered.

// Checking Claims:

// The jwt.verify method also checks specific claims in the payload to ensure the token is valid:
// exp: Expiration time. The token must not be expired.
// nbf: Not before time. The token must not be used before this time.
// iat: Issued at time. The token is checked against the issuance time.
// aud: Audience. The token is checked to ensure it is intended for the correct audience.
// iss: Issuer. The token is checked to ensure it was issued by a trusted source.
