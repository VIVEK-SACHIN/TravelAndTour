const express = require('express');
const userController = require('./../controllers/userController');
const authcontroller = require('./../controllers/authController');

const router = express.Router();
// this is a special kind of end point as it does not fit the rest architecture
router.post('/signup', authcontroller.signup);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
