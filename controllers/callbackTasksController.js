const MainController = require('./MainController');
const CallbackTasks = require('../models/CallbackTasks');

class callbackTasks extends MainController{

}

const callbackTasksCls = new callbackTasks(CallbackTasks);

module.exports = callbackTasksCls;