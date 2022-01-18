const express = require('express');
const router  = express.Router();
const Spammer = require('../modules/Spamer')

router.options("/*", function(req, res, next){
	console.log(req.headers);
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Credentials','true')
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
	// res.send(200);
	res.sendStatus(200);
});

router.get('/', (req, res)=>{
	res.json({aaa:'bbb'})
})
router.post('/create_account', (req, res)=>{

	console.log(req)

	res.append('Access-Control-Allow-Origin', req.headers.origin)
	res.append('Access-Control-Allow-Credentials','true')

	return Spammer.createAccount(req,res)
})
router.post('/confirm_code', (req, res)=>{

	res.append('Access-Control-Allow-Origin', req.headers.origin)
	res.append('Access-Control-Allow-Credentials','true')

	return Spammer.confirmCode(req,res)
})

router.post('/create_send_task', (req, res)=>{
	return Spammer.createSendTask(req,res)
})

router.post('/parse_contacts', (req, res, next) => {

	console.log(req.body)

	return Spammer.parseContactsAll(req, result=>{
		return res.json(result)
	})
})
module.exports = router;