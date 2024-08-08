const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();
// this is a special kind of end point as it does not fit the rest architecture
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateUserData', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(
    authController.restrictTo('admin', 'lead-guide'),
    userController.createUser
  );

router
  .route('/:id')
  .get(authController.restrictTo('admin', 'lead-guide'), userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    userController.deleteUser
  );

module.exports = router;
