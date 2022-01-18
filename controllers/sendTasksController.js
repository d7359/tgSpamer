const MainController = require('./MainController');
const SendTasks = require('../models/SendTasks');

class sendTasks extends MainController{

}

const sendTasksCls = new sendTasks(SendTasks);

module.exports = sendTasksCls;