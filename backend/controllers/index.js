const paymentController = require('./paymentController');
const pledgeController = require('./pledgeController');
const userController = require('./userController');
const authController = require('./authController');

// Simple CommonJS aggregator for controllers
// Require individual controllers and export as a grouped object.


module.exports = {
    paymentController,
    pledgeController,
    userController,
    authController,
};