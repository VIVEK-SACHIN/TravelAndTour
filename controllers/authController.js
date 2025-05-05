const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signtoken = id =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
const createSendToken = (user, statuscode, res) => {
  const token = signtoken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  res.status(statuscode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    user: req.body.user,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  //to make it more secure with select false it will not come in find queries but it will come it user creation
  newUser.password = undefined;
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // loging a user is a three step process

  //checking if user exist and password is correct
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  //check if user exists and password is correct .
  const user = await User.findOne({ email }).select('+password');
  //to select some feild with select property set as false use this .select('+password')

  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError('username Or password is incorrect', 401));
  }
  //send the authorized token
  user.password = undefined;
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and cheking of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  //2)verification of token

  //at third argument this jwt verify takes a callack function which will run in case
  //verification was successful but to go with async await style we would use promisify

  //alternative way
  //const verifyAsync = promisify(jwt.verify);
  //const decoded = await verifyAsync(token, secretKey);

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exists
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER passing data to rendering template
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//we can not pass arguments directly to a middleware function so for this case we use wrapper function
exports.restrictTo = (...roles) => {
  // Rest parameters allow you to represent an indefinite number of arguments as an array. This is the modern and recommended approach over using arguments.
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(roles);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenexpires: { $gt: Date.now() }
  });
  //2)IF token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetTokenexpires = undefined;
  await user.save();

  //3)Update changedPasswordAt property for the user

  //4)Log the user in, send JWT
  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.verifyPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('password galat hai', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
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
