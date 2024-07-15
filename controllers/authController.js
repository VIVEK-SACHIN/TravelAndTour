const catchAsync =require('./../utils/catchAsync');
const User =require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
exports.signup = catchAsync(async (req,res,next)=>{
  const newUser = await User.create({
    name:req.body.name,
    user:req.body.user,
    password:req.body.password,
    passwordConfirm:req.body.passwordConfirm
  });
  var token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn :process.env.JWT_EXPIRES_IN });
  res.status(201).json({
     status: 'success',
     token,
     data: {
        user: newUser
     }
  });
});

exports.login = (req,res,next)=>{
  const {email,password} =req.body;
  // loging a user is a three step process 

  //checking if user exist and password is correct 
  if(!email&&!password){
    return next(new AppError('please provide email and password',400));
  }

  //check if user exists and password is correct .
  const User=findOne({email});

  const token = '';

  res.status(200).json({
    status:'success',
    token,
  });
}