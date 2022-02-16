// const moment = require('moment');
const mongoose = require('mongoose');
const connect = mongoose.createConnection('mongodb://127.0.0.1:27017/tg_spammer', {
	serverSelectionTimeoutMS: 10000,
	useNewUrlParser: true,
	// useCreateIndex: true,
	// useFindAndModify: false,
	useUnifiedTopology: true,
});
connect.once('open', () => {
	console.info('mongoose|connect|open');
});
connect.once('error', (error) => {
	console.error('mongoose|connect|error', error);
	process.exit(1);
});

const Schema = mongoose.Schema;

/**
 * Схема событий
 * @type {Schema}
 */
const schemaEvents = new Schema({
	id: {
		type: String,
		required: true,
		// index:{unique:true, background:false}
	},
	access_hash:{
		type:String,
		required: true,
	},
	first_name: {
		type: String,
	},
	last_name: {
		type: String,
	},
	username: {
		type: String,
	},
	phone: {
		type: String,
		// required:   true,
	},
	tg_account:{
		type:String
	}

}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});
module.exports = connect.model('tg_contacts', schemaEvents);