// const moment = require('moment');
const mongoose = require('mongoose');
const connect = mongoose.createConnection('mongodb://127.0.0.1:27017/tg_spammer', {
	serverSelectionTimeoutMS: 5000,
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
	phone: {
		type: String,
		required: true,
	},
	code:{
		type:String,
	},
	api_id: {
		type: String,
		required:   true,
	},
	api_hash: {
		type: String,
		required:   true,
	},
	phone_code_hash: {
		type: String,
		// required:   true,
	},
	project: {
		type: String,
		// required:   true,
	},
	status:{
		type: String,
		enum:[
			'draft',
			'active',
			'stop',
			'finish'
		],
		required: true,
	}

}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});
module.exports = connect.model('tg_accounts', schemaEvents);