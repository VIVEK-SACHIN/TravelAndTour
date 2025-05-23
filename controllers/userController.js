const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create ERROR if user posts password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError('You are not allowed to set password using this route ', 400)
    );
  }
  //2)update the user documents
  const filterBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filterBody.photo = req.file.filename;
  }
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

exports.createUser = catchAsync(async (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
});
// do not change password using this
exports.updateUser = factory.updateOne(User);

// exports.updateUser = catchAsync(async (req, res, next) => {
//   if (req.body.password && !req.body.confirmPassword) {
//     return next(new AppError('Please enter & confirm Password', 400));
//   }
//   const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   res.status(200).json({
//     status: 'success',
//     data: {
//       user: updatedUser
//     }
//   });
// });
// exports.deleteUser = catchAsync(async (req, res, next) => {
//   const user = await User.findByIdAndUpdate(req.params.id, { active: false });
//   if (!user) return next(new AppError('no such user exists', 404));
//   res.status(204).json({
//     sucess: 'status',
//     user
//   });
// });
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });
// exports.getUser = catchAsync(async (req, res) => {
//   const user = await User.findById(req.params.id);
//   console.log(req.params.id, req.user);
//   res.status(200).json({
//     status: 'success',
//     user,
//     requestedBy: req.user
//   });
// });
