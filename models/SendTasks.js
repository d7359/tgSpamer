const mongoose = require('mongoose');
const connect  = mongoose.createConnection('mongodb://127.0.0.1:27017/tg_spammer', {
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
const schemaReminds = new Schema({

	execute_time:{
		type: Date,
		required:   true,
	},
	status:{
		type: String,
		enum:[
			null,
			'ok',
			'inWork',
			'error',
		],
		default: null
	},
	data:{
		type:{}
	}

});
module.exports = connect.model('send_tasks', schemaReminds);