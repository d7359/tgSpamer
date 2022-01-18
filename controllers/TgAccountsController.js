const MainController = require('./MainController');
const TgAccounts = require('../models/TgAccounts');

class tgAccounts extends MainController{

}

const tgAccountsCls = new tgAccounts(TgAccounts);

module.exports = tgAccountsCls;