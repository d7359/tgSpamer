const MainController = require('./MainController');
const TgAccounts = require('../models/TgContacts');

class tgAccounts extends MainController{

}

const tgAccountsCls = new tgAccounts(TgAccounts);

module.exports = tgAccountsCls;