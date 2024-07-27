const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create ERROR if user posts password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError('You are not allowed to set password using this route ', 400)
    );
  }
  //2)update the user documents
  const filterBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  console.log(req.params.id, req.user);
  res.status(200).json({
    status: 'success',
    user,
    requestedBy: req.user
  });
});
exports.createUser = catchAsync(async (req, res) => {
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
  res.status(200).json({
    status: 'sucess',
    user: newUser
  });
});
exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password && !req.body.confirmPassword) {
    return next(new AppError('Please enter & confirm Password', 400));
  }
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false });
  if (!user) return next(new AppError('no such user exists', 404));
  res.status(204).json({
    sucess: 'status',
    user
  });
});
