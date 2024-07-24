const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

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
exports.updateMe=catchAsync(async(req,res,next)=>{
   //1)create ERROR if user posts password data 
   if(req.body.password||req.body.confirmPassword){
    return next(new AppError('You are not allowed to set password using this route ',400));
   }
   //2)update the user documents 
   const filterBody = filterObj(req.body,'name','email');
   const updatedUser = await User.findByIdAndUpdate(req.user._id,filterBody,{new:true,runValidators:true});
})
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
