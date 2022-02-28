const express        = require('express');
const cookieParser   = require('cookie-parser');
const bodyParser     = require('body-parser');
const path           = require('path');
// const SiteModule     = require('./modules/SiteModule')
const moment           = require('moment');
// const cors         = require('cors');
const isDebug        = process.env.IN_WORKS !== undefined;
// const {rollbar}    = require('../coreMain/RollbarLogger')('@diman7359');

const Spammer = require('./modules/Spamer')
// const UnixSocket = require('../coreMain/UnixSocket')

const indexRouter = require('./routes/index')
// https://github.com/starak/node-console-stamp
require('console-stamp')(console, {
	metadata: function () {
		const orig              = Error.prepareStackTrace;
		Error.prepareStackTrace = (_, stack) => stack;
		const err               = new Error;
		Error.captureStackTrace(err, arguments.callee);
		const stack             = err.stack;
		Error.prepareStackTrace = orig;
		return (`[${stack[1].getFileName()}:${stack[1].getLineNumber()}\n`);
	},
	colors  : {
		stamp   : 'yellow',
		label   : 'white',
		metadata: 'green'
	},
	// exclude: isDebug || isLocalProduct ? [] : ["log", "info", "warn", "error", "dir", "assert"],
});

const app = express();


// app.options('*', cors(corsOptions));

app.set('view cache', false);


app.use(bodyParser.json({
	limit   : '50mb',
	extended: true
}));
app.use(bodyParser.urlencoded({
	limit   : '50mb',
	extended: true
}));
app.use(express.json());
// app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use("/public", express.static(__dirname + '/public'));


// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'twig');
//app.use("/public", express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// app.use('/public', express.static(__dirname + '/public'));


// catch 404 and forward to error handler
// app.use((req, res, next)=> {
// 	res.render('error', {
// 		// Config: Config,
// 		title: 'ОШИБКА 404'
// 	});
// 	//next(createError(404));
// });

app.use(function(err, req, res) {

	// set locals, only providing error in development
	// res.locals.message = err.message;
	// res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.sendStatus(500);
	// res.render('error');
});

class MainClass{

	 constructor(){

		console.log('aaaaaa')

		Spammer.initSpammer()

		// console.log(moment().utc().format('YYYY-MM-DD HH:mm:ss'))
		// console.log(moment().utc().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss'))
		// console.log(moment().utc().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss'))
		// console.log(moment().format('YYYY-MM-DD HH:mm:ss'))
		// console.log(moment('2021-01-05 13:00:00').subtract(4,'hours').add(6,'hours').format('YYYY-MM-DD HH:mm:ss'))
		// console.log(moment('2021-01-05 12:00:00').subtract(3,'hours').add(6,'hours').format('YYYY-MM-DD HH:mm:ss'))

		// if(!isDebug) {
		//
		// 	WeblikModule.initWorkers(__dirname, ()=>{
		//
		// 		WeblikModule.checkNextTimeRemindTask(() => {
		//
		// 			WeblikModule.checkNextTimeFinalsTask(() => {
		//
		// 				WeblikModule.remindsTasksExecutor()
		// 				WeblikModule.finalsTasksExecutor()
		//
		// 				WeblikModule.createSocketServer(3133);
		// 				WeblikModule.sendUpdateEventStatistic();
		//
		// 				UnixSocket.server('weblik.socket', async function (data, socket) {
		//
		//
		// 					socket({status: 'ok'})
		// 					return WeblikModule.incomingDataHandler(data, result => {
		//
		// 						console.log(result)
		//
		// 					})
		//
		// 				})
		// 			})
		// 		})
		// 	})
		//
		// }
	}
}

const ClsMainClass = new MainClass();

module.exports = app;