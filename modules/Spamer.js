const moment = require('moment')
const async = require('async')
const request = require('request')
const API = require('./Api')
const TgAccounts = require('../controllers/TgAccountsController')
const TgContacts = require('../controllers/tgContactsController')
const sendTasksController = require('../controllers/sendTasksController')
const callbackTasksController = require('../controllers/callbackTasksController')
// const config = require('../config.json')


class Spammer{

	constructor() {
		this.accounts = {

		}
	}

	async initSpammer(){
		await this.initAccounts()

		// await this.sendMessage(data)
		 this.checkSendTasks()
		 this.checkCallbackTasks()


	}

	parseContactsAll(req, callback){

		console.log('parseContactsAll')

		let contacts = []

		console.log(req.body)
		console.log({project:req.body.project, status:'active'})

		return TgAccounts.getAllByCondition({project:req.body.project, status:'active'}, result=>{

			console.log(result)

			if(result.error || result.length===0){

				return callback({status:'ok'})
			}

			return Promise.all(result.map(async row => await this.parseContacts(row.phone, req.body, ()=>{})))
				.then(values=>{

					console.log(values)

					return callback({status:'ok'})

				})

			async.eachSeries(result, (row, rowCallback)=>{
					this.parseContacts(row.phone, req.body, result=>{
						console.log(result)

						if(contacts.length===0){
							contacts = result.contacts
						}

						return setTimeout(()=>{rowCallback()}, 1000)
					})
				},
				err=>{
					if(err){
						console.error(err)
					}

					return callback({status:'ok'})

					// return request({
					// 	url:'https://pay.telegramer.bot/save_contacts',
					// 	method:'POST',
					// 	headers:{'Content-Type':'application/json'},
					// 	body:JSON.stringify({contacts, parsingId:req.body.parsingId, project:req.body.project})
					// }, (error,  httpResponse, body)=>{
					// 	console.error(error)
					// 	// console.log(httpResponse)
					// 	console.log(body)
					//
					// 	return callback({status:'ok'})
					// })


				})

		})


	}

	sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	async parseContacts(phone, data, callback){

		return new Promise(async resolve=>{



		let invite = false;
		let chat_users = []

		const hash = data.hash.replace('https://','').replace('http://','').replace('t.me/joinchat/','').replace('t.me/+','').replace('t.me/','')

		// try {
			invite = await this.accounts[phone].call('messages.importChatInvite', {hash: hash})
			// const invite = await API.call('messages.importChatInvite',{hash:'lcHhKERxZg4wOWYy'})

			console.log('invite:', invite)


			if(invite.error_code){
				if(invite.error_message && invite.error_message ==='USER_ALREADY_PARTICIPANT'){
					const checkChatInvite = await this.accounts[phone].call('messages.checkChatInvite', {
						hash:hash,
						// limit:10
					})

					console.log(checkChatInvite);


					if(checkChatInvite.chat){
						const leaveChannel = await this.accounts[phone].call('channels.leaveChannel', {
							channel:{
								_:'inputChannel',
								channel_id:checkChatInvite.chat.id,
								access_hash: checkChatInvite.chat.access_hash
							}
						})

						return this.parseContacts(phone, data, callback)

					}
				}

				const search = await this.accounts[phone].call('contacts.search', {
					q:'@'+hash.replace('@',''),
					limit:10
				})

				console.log(search);

				if(search.error_code){
					return resolve({status:'error', msg:'Ничего не найдено'})
				}

				if(search.chats.length===0){
					return resolve({status:'error', msg:'Ничего не найдено'})
				}

				const searched = search.chats.find(el=>el.username===hash.replace('@',''))

				if(!searched){
					return resolve({status:'error', msg:'Ничего не найдено'})
				}

				// const joinChannel = await this.accounts[phone].call('channels.joinChannel', {
				// 	channel: {
				// 		_:'inputChannel',
				// 		channel_id:searched.id,
				// 		access_hash:searched.access_hash
				// 	}
				// })
				//
				// console.log('chat:', joinChannel)


				const users = {}

				const inputPeer = {
					// _: 'inputPeerChannel',
					_: 'inputPeerChannel',
					// channel_id: channel.id,
					channel_id: searched.id,
					access_hash: searched.access_hash
				};

				console.log(inputPeer)

				const LIMIT_COUNT = 100
				let offset = 0;
				const allMessages = [];

				let history = await this.accounts[phone].call('messages.getHistory', {
					peer: inputPeer,
					add_offset: offset,
					limit: LIMIT_COUNT,
				});

				if(history.error_code){
					return resolve({status:'error', msg:'Ничего не найдено'})
				}


				await this.sleep(1000)
				// console.log(firstHistoryResult)

				// const historyCount = firstHistoryResult.count;
				// const historyCount = firstHistoryResult.messages.length;


				// for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
				while(history.messages.length>0){

					allMessages.push(...history.messages);

					offset+=LIMIT_COUNT

					history = await this.accounts[phone].call('messages.getHistory', {
						peer: inputPeer,
						add_offset: offset,
						limit: LIMIT_COUNT,
					});

					if(history.error_code){
						history.messages = []
					}

					await this.sleep(1000)


				}


				for(const message of allMessages){

					if(!message.from_id || !message.from_id.user_id){
						continue;
					}

					if(message._==='message'){
						// console.log(message)

						users[message.from_id.user_id] = {
							_:'inputUserFromMessage',
							peer: inputPeer,
							msg_id: message.id,
							user_id: message.from_id.user_id
						}
					}


					if(message._==='messageService' && message.action && message.action._==='messageActionChatAddUser'){
						// console.log(message)

						users[message.from_id.user_id] = {
							_:'inputUserFromMessage',
							peer: inputPeer,
							msg_id: message.id,
							user_id: message.from_id.user_id
						}
					}


					if(message._==='messageService' && message.action && message.action._==='messageActionChatJoinedByLink'){
						// console.log(message)

						users[message.from_id.user_id] = {
							_:'inputUserFromMessage',
							peer: inputPeer,
							msg_id: message.id,
							user_id: message.from_id.user_id
						}
					}
				}

				// const getUsers = await this.accounts[phone].call('users.getUsers', {
				// 	id:Object.values(users)
				// })

				let start =0
				let end = 200
				let peerUsers = Object.values(users).slice(start,end)

				console.log('peerUsers:', peerUsers.length)

				let resultUsers =[]

				while(peerUsers.length>0) {

					const getUsers = await this.accounts[phone].call('users.getUsers', {
						id: Object.values(peerUsers)
					})

					await this.sleep(1000)

					console.log(getUsers.length);

					resultUsers = [...resultUsers, ...getUsers]

					start+=200
					end+=200


					peerUsers = Object.values(users).slice(start,end)

					console.log('peerUsers:', peerUsers.length)



				}

				console.log(resultUsers.length);

				chat_users = resultUsers

				// const leaveChannel = await this.accounts[phone].call('channels.leaveChannel', {
				// 	channel:{
				// 		_:'inputChannel',
				// 		channel_id: searched.id,
				// 		access_hash: searched.access_hash
				// 	}
				// })
			}

		// }
		// catch (e){
		// 	console.log(e)
		//
		// 	if(e.error_message && e.error_message ==='USER_ALREADY_PARTICIPANT'){
		// 		const checkChatInvite = await this.accounts[phone].call('messages.checkChatInvite', {
		// 			hash:data.hash,
		// 			// limit:10
		// 		})
		//
		// 		console.log(checkChatInvite);
		//
		//
		// 		if(checkChatInvite.chat){
		// 			const leaveChannel = await this.accounts[phone].call('channels.leaveChannel', {
		// 				channel:{
		// 					_:'inputChannel',
		// 					channel_id:checkChatInvite.chat.id,
		// 					access_hash: checkChatInvite.chat.access_hash
		// 				}
		// 			})
		//
		// 			return this.parseContacts(phone, data, resolve)
		//
		// 		}
		// 	}
		//
		// 	const search = await this.accounts[phone].call('contacts.search', {
		// 		q:'@'+data.hash.replace('@',''),
		// 		limit:10
		// 	})
		//
		// 	console.log(search);
		//
		// 	if(search.chats.length===0){
		// 		return resolve({status:'error', msg:'Ничего не найдено'})
		// 	}
		//
		// 	const joinChannel = await this.accounts[phone].call('channels.joinChannel', {
		// 		channel: {
		// 			_:'inputChannel',
		// 			channel_id:search.chats[0].id,
		// 			access_hash:search.chats[0].access_hash
		// 		}
		// 	})
		//
		// 	console.log('chat:', joinChannel)
		//
		//
		// 	const users = {}
		//
		// 	const inputPeer = {
		// 		// _: 'inputPeerChannel',
		// 		_: 'inputPeerChannel',
		// 		// channel_id: channel.id,
		// 		channel_id: search.chats[0].id,
		// 		access_hash: search.chats[0].access_hash
		// 	};
		//
		// 	console.log(inputPeer)
		//
		// 	const LIMIT_COUNT = 9999
		// 	let offset = 0;
		// 	const allMessages = [];
		//
		// 	let history = await this.accounts[phone].call('messages.getHistory', {
		// 		peer: inputPeer,
		// 		add_offset: offset,
		// 		limit: LIMIT_COUNT,
		// 	});
		//
		//
		// 	await this.sleep(1000)
		// 	// console.log(firstHistoryResult)
		//
		// 	// const historyCount = firstHistoryResult.count;
		// 	// const historyCount = firstHistoryResult.messages.length;
		//
		//
		// 	// for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
		// 	while(history.messages.length>0){
		//
		// 		allMessages.push(...history.messages);
		//
		// 		offset+=LIMIT_COUNT
		//
		// 		history = await this.accounts[phone].call('messages.getHistory', {
		// 			peer: inputPeer,
		// 			add_offset: offset,
		// 			limit: LIMIT_COUNT,
		// 		});
		//
		// 		await this.sleep(1000)
		//
		//
		// 	}
		//
		//
		// 	for(const message of allMessages){
		//
		// 		if(!message.from_id || !message.from_id.user_id){
		// 			continue;
		// 		}
		//
		// 		if(message._==='message'){
		// 			// console.log(message)
		//
		// 			users[message.from_id.user_id] = {
		// 				_:'inputUserFromMessage',
		// 				peer: inputPeer,
		// 				msg_id: message.id,
		// 				user_id: message.from_id.user_id
		// 			}
		// 		}
		//
		//
		// 		if(message._==='messageService' && message.action && message.action._==='messageActionChatAddUser'){
		// 			// console.log(message)
		//
		// 			users[message.from_id.user_id] = {
		// 				_:'inputUserFromMessage',
		// 				peer: inputPeer,
		// 				msg_id: message.id,
		// 				user_id: message.from_id.user_id
		// 			}
		// 		}
		//
		//
		// 		if(message._==='messageService' && message.action && message.action._==='messageActionChatJoinedByLink'){
		// 			// console.log(message)
		//
		// 			users[message.from_id.user_id] = {
		// 				_:'inputUserFromMessage',
		// 				peer: inputPeer,
		// 				msg_id: message.id,
		// 				user_id: message.from_id.user_id
		// 			}
		// 		}
		// 	}
		//
		// 	const getUsers = await this.accounts[phone].call('users.getUsers', {
		// 		id:Object.values(users)
		// 	})
		//
		// 	console.log(getUsers);
		//
		// 	chat_users = getUsers
		//
		// 	const leaveChannel = await this.accounts[phone].call('channels.leaveChannel', {
		// 		channel:{
		// 			_:'inputChannel',
		// 			channel_id: search.chats[0].id,
		// 			access_hash: search.chats[0].access_hash
		// 		}
		// 	})
		// }

		let chat = false

		if(invite.chats && invite.chats[0]._==='chat') {
			chat = await this.accounts[phone].call('messages.getFullChat', {chat_id: invite.chats[0].id})

			console.log('chat:', chat)

			chat_users = chat.users
			const deleteChat = await this.accounts[phone].call('messages.deleteChatUser', {
				revoke_history: true,
				chat_id:invite.chats[0].id,
				user_id: {
					_:'inputUserSelf'
				}
			})
		}

		if(invite.chats  && invite.chats[0]._==='channel') {
			const users = {}

			const inputPeer = {
				// _: 'inputPeerChannel',
				_: 'inputPeerChannel',
				// channel_id: channel.id,
				channel_id: invite.chats[0].id,
				access_hash: invite.chats[0].access_hash
			};

			console.log(inputPeer)

			const LIMIT_COUNT = 100
			let offset = 0;
			const allMessages = [];

			let history = await this.accounts[phone].call('messages.getHistory', {
				peer: inputPeer,
				add_offset: offset,
				limit: LIMIT_COUNT,
			});

			if(history.error_code){
				return resolve({status:'error', msg:'Ничего не найдено'})
			}
			await this.sleep(1000)
			// console.log(firstHistoryResult)

			// const historyCount = firstHistoryResult.count;
			// const historyCount = firstHistoryResult.messages.length;


			// for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
			while(history.messages.length>0){

				allMessages.push(...history.messages);

				offset+=LIMIT_COUNT

				history = await this.accounts[phone].call('messages.getHistory', {
					peer: inputPeer,
					add_offset: offset,
					limit: LIMIT_COUNT,
				});

				if(history.error_code){
					history.messages=[]
				}
				await this.sleep(1000)

			}


			for(const message of allMessages){

				if(!message.from_id || !message.from_id.user_id){
					continue;
				}

				if(message._==='message'){
					// console.log(message)

					users[message.from_id.user_id] = {
						_:'inputUserFromMessage',
						peer: inputPeer,
						msg_id: message.id,
						user_id: message.from_id.user_id
					}
				}


				if(message._==='messageService' && message.action && message.action._==='messageActionChatAddUser'){
					// console.log(message)

					users[message.from_id.user_id] = {
						_:'inputUserFromMessage',
						peer: inputPeer,
						msg_id: message.id,
						user_id: message.from_id.user_id
					}
				}


				if(message._==='messageService' && message.action && message.action._==='messageActionChatJoinedByLink'){
					// console.log(message)

					users[message.from_id.user_id] = {
						_:'inputUserFromMessage',
						peer: inputPeer,
						msg_id: message.id,
						user_id: message.from_id.user_id
					}
				}
			}

			// const getUsers = await this.accounts[phone].call('users.getUsers', {
			// 	id:Object.values(users)
			// })

			let start =0
			let end = 200
			let peerUsers = Object.values(users).slice(start,end)

			console.log('peerUsers:', peerUsers.length)

			let resultUsers =[]

			while(peerUsers.length>0) {

				const getUsers = await this.accounts[phone].call('users.getUsers', {
					id: Object.values(peerUsers)
				})

				await this.sleep(1000)

				console.log(getUsers.length);

				resultUsers = [...resultUsers, ...getUsers]

				start+=200
				end+=200


				peerUsers = Object.values(users).slice(start,end)

				console.log('peerUsers:', peerUsers.length)



			}

			console.log(resultUsers.length);

			chat_users = resultUsers;

			const leaveChannel = await this.accounts[phone].call('channels.leaveChannel', {
				channel:{
					_:'inputChannel',
					channel_id: invite.chats[0].id,
					access_hash: invite.chats[0].access_hash
				}
			})
		}
		// console.log(chat.full_chat.participants.participants)

// return;
// 		const deleteChat = await this.accounts[phone].call('messages.deleteChatUser', {
// 			revoke_history: true,
// 			chat_id:invite.chats[0].id,
// 			user_id: {
// 				_:'inputUserSelf'
// 			}
// 		})


		const contactIds = chat_users.map(el=>el.id)

		const contacts = []

		return TgContacts.getAllByCondition({id:{$in:contactIds}, tg_account:phone}, result=>{

			console.log(result)

			const oldContacts = result.map(el=>el.id)

			// const diffContacts = contactIds.filter(el => !oldContacts.includes(el))

			for(const user of chat_users){

				if(oldContacts.includes(user.id)){
					continue;
				}

				contacts.push({
					id:user.id,
					access_hash:user.access_hash,
					first_name:user.first_name || '',
					last_name:user.last_name || '',
					username:user.username || '',
					phone:user.phone || '',
					tg_account:phone
				})

				// const addContact = await API.call('contacts.addContact', {
				// 	id	:{
				// 		_: 'inputUser',
				// 		user_id: user.id,
				// 		access_hash: user.access_hash
				// 	},
				// 	first_name:	user.first_name || '',
				// 	last_name:	user.last_name || '',
				// 	phone:	user.phone ||''
				// })
				//
				// console.log('addContact:',addContact)
				// const resultOfSendMessage = await API.call()
			}

			return TgContacts.createMany(contacts, result=>{


				console.log(result)

				return resolve({status: 'ok', contacts})
			})

		})


		})

	}

	async getAccounts(){
		 return await TgAccounts.getAllByCondition({status:'active'});
	}

	async initAccounts(){

		return new Promise(async resolve=>{
			const accounts = await this.getAccounts()

			if(accounts.error){

				console.error(accounts);

				return resolve()
			}

			for(const account of accounts){


				await this.initAccount(account)
				// this.accounts[account.phone] = new API(account)
				//
				// const user = await this.getUser(account.phone);
				//
				// if(!user){
				// 	continue;
				// }
				//
				// this.accounts[account.phone].mtproto.updates.on('updatesTooLong', (updateInfo) => {
				// 	console.log('updatesTooLong:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updateShortMessage', (updateInfo) => {
				// 	console.log('updateShortMessage:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updateShortChatMessage', (updateInfo) => {
				// 	console.log('updateShortChatMessage:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updateShort', (updateInfo) => {
				// 	console.log('updateShort:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updatesCombined', (updateInfo) => {
				// 	console.log('updatesCombined:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updates', async (updateInfo) => {
				// 	console.log('updates:', updateInfo);
				// });
				//
				// this.accounts[account.phone].mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
				// 	console.log('updateShortSentMessage:', updateInfo);
				// });
			}

			return resolve()
		})

	}

	 initAccount(account){

		console.log('initAccount')

		return new Promise(async resolve => {

			if(!this.accounts[account.phone]) {

				this.accounts[account.phone] = new API(account)
			}

			const user = await this.getUser(account.phone);

			if(!user){
				return resolve();
			}

			this.accounts[account.phone].mtproto.updates.on('updatesTooLong', (updateInfo) => {
				// console.log('updatesTooLong:', updateInfo);
			});

			this.accounts[account.phone].mtproto.updates.on('updateShortMessage', async (updateInfo) => {
				// console.log('updateShortMessage:', updateInfo);

				await callbackTasksController.create({execute_time:moment().format('YYYY-MM-DD HH:mm:ss'), data: {phone:account.phone, user:{id:updateInfo.user_id},incomingMessage:true}})
			});

			this.accounts[account.phone].mtproto.updates.on('updateShortChatMessage', async (updateInfo) => {
				// console.log('updateShortChatMessage:', updateInfo);


			});

			this.accounts[account.phone].mtproto.updates.on('updateShort', (updateInfo) => {
				// console.log('updateShort:', updateInfo);
			});

			this.accounts[account.phone].mtproto.updates.on('updatesCombined', (updateInfo) => {
				// console.log('updatesCombined:', updateInfo);
			});

			this.accounts[account.phone].mtproto.updates.on('updates', async (updateInfo) => {
				// console.log('updates:', updateInfo);
			});

			this.accounts[account.phone].mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
				// console.log('updateShortSentMessage:', updateInfo);
			});

			return resolve();
		})

	}

	async createAccount(req, res){
		const accounts = await TgAccounts.getAllByCondition({phone:req.body.phone})

		if(accounts.error){
			console.error(accounts)
			return res.json({status:'error', msg:'Ошибка при проверке аккаунта'})
		}

		if(accounts.length>0){
			return res.json({status:'error', msg:'Уже есть такой аккаунт'})
		}

		console.log(accounts)

		let result = await TgAccounts.create({phone: req.body.phone, api_id: req.body.api_id, api_hash:req.body.api_hash, project:req.body.project, status:'draft'})

		console.log(result)

		if(result.error){
			console.error(result)
			return res.json({status:'error', msg:'Ошибка при проверке аккаунта'})
		}

		await this.initAccount(req.body)

		const { phone_code_hash } = await this.sendCode(req.body.phone);

		result = await TgAccounts.update({phone: req.body.phone}, {phone_code_hash})

		if(result.error){
			console.error(result)
			return res.json({status:'error', msg:'Ошибка при проверке аккаунта'})
		}

		return res.json({status:'ok'})
		// this.accounts

	}

	async createSendTask(req, res){

		let result = await sendTasksController.create({...req.body, execute_time: moment(req.body.execute_time).subtract(6,'hours').format('YYYY-MM-DD HH:mm:ss')})

		if(result.error){
			console.error(result)
			return res.json({status:'error', msg:'Ошибка при создании'})
		}

		return res.json({status:'ok'})

	}


	async confirmCode(req, res){

		const accounts = await TgAccounts.getAllByCondition({phone:req.body.phone})

		if(accounts.error){
			console.error(accounts)
			return res.json({status:'error', msg:'Ошибка при проверке аккаунта'})
		}

		if(accounts.length===0){
			return res.json({status:'error', msg:'Нет такого аккаунта'})
		}

		const account = accounts[0]

		account.code = req.body.code

		try {
			const signInResult = await this.signIn({
				code: account.code,
				phone: account.phone,
				phone_code_hash: account.phone_code_hash,
			});

			if (signInResult._ === 'auth.authorizationSignUpRequired') {
				await this.signUp({
					phone: account.phone,
					phone_code_hash: account.phone_code_hash,
				});
			}



			let result = await TgAccounts.update({phone:req.body.phone}, {status:'active'})

			if(result.error){
				console.error(result)
				return res.json({status:'error', msg:'Ошибка при активации аккаунта'})
			}

			await this.initAccount(account)

			return res.json({status:'ok'})


		} catch (error) {
			console.error(error)

			return res.json({status:'error', msg:'Ошибка авторизации'})
		}

	}

	async getUser(phone) {
		try {
			const user = await this.accounts[phone].call('users.getFullUser', {
				id: {
					_: 'inputUserSelf',
				},
			});

			if(user.error_code){
				return null
			}

			return user;
		} catch (error) {
			return null;
		}
	}

	sendCode(phone) {
		return this.accounts[phone].call('auth.sendCode', {
			phone_number: phone,
			settings: {
				_: 'codeSettings',
			},
		});
	}

	signIn({ code, phone, phone_code_hash }) {
		return this.accounts[phone].call('auth.signIn', {
			phone_code: code,
			phone_number: phone,
			phone_code_hash: phone_code_hash,
		});
	}

	signUp({ phone, phone_code_hash }) {
		return this.accounts[phone].call('auth.signUp', {
			phone_number: phone,
			phone_code_hash: phone_code_hash,
			first_name: 'MTProto',
			last_name: 'Core',
		});
	}

	getPassword(phone) {
		return this.accounts[phone].call('account.getPassword');
	}

	checkPassword(phone, { srp_id, A, M1 }) {
		return this.accounts[phone].call('auth.checkPassword', {
			password: {
				_: 'inputCheckPasswordSRP',
				srp_id,
				A,
				M1,
			},
		});
	}

	async checkSendTasks(){

		const tasks = await sendTasksController.getAllByCondition({status: null, execute_time: {$lte: moment().format('YYYY-MM-DD HH:mm:ss')}})
		console.log(tasks)
		if(tasks.error){
			return setTimeout(()=>{this.checkSendTasks()}, 3000)
		}

		if(tasks.length===0){
			return setTimeout(()=>{this.checkSendTasks()}, 3000)
		}

		await this.executeSendTasks(tasks)

		return setTimeout(()=>{this.checkSendTasks()}, 3000)

	}

	async checkCallbackTasks(){

		const tasks = await callbackTasksController.getAllByCondition({status: null, execute_time: {$lte: moment().format('YYYY-MM-DD HH:mm:ss')}})

		console.log(tasks)

		if(tasks.error){
			return setTimeout(()=>{this.checkCallbackTasks()}, 3000)
		}

		if(tasks.length===0){
			return setTimeout(()=>{this.checkCallbackTasks()}, 3000)
		}

		await this.executeCallbackTasks(tasks)

		this.checkCallbackTasks()

	}

	executeSendTasks(tasks){
		return new Promise(async resolve=>{

			const success_ids = []
			const failure_ids = []
			const callbackTasks = []

			// const invite = await this.accounts['+77028596374'].call('messages.importChatInvite',{hash:'hnIbL0XxSBliZDE6'})
			// // const invite = await API.call('messages.importChatInvite',{hash:'lcHhKERxZg4wOWYy'})
			//
			// console.log('invite:',invite)
			//
			// const deleteChat = await this.accounts['+77028596374'].call('messages.deleteChatUser', {
			// 	revoke_history: true,
			// 	// chat_id:invite.chats[0].id,
			// 	chat_id:'671298884',
			// 	user_id: {
			// 		_:'inputUserSelf'
			// 	}
			// })

			return async.eachSeries(tasks, (task, taskCallback)=>{
					(async ()=>{

						const callbackTask = {
							data:task.data,
							execute_time: moment().format('YYYY-MM-DD HH:mm:ss')
						}

						callbackTask.data.type = 'status'

						if(task.data.testing){

							if(task.data.answer){
								const sendMessage = await this.accounts[task.data.phone].call('messages.sendMessage', {
									peer	:{
										_: 'inputPeerUser',
										user_id: task.data.user.id,
										access_hash: task.data.user.access_hash
									},
									message: task.data.message,
									random_id:	Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
									// phone:	user.phone ||''
								})

								console.log('sendMessage:', sendMessage)


								callbackTask.data.sent = true
								success_ids.push(task._id.toString())

								callbackTasks.push(callbackTask)

								return setTimeout(()=>{taskCallback()})
							}


							const deleteByPhones = await this.accounts[task.data.phone].call('contacts.deleteByPhones', {
								// _:'inputPhoneContact',
								phones:task.data.user.phone_number.replace('+', '')
							})

							console.log('deleteByPhones:',deleteByPhones)


							const importContacts = await this.accounts[task.data.phone].call('contacts.importContacts', {
								// _:'inputPhoneContact',
								contacts:[{
									_         : 'inputPhoneContact',
									// 		client_id : Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
									client_id : task.data.user.user_id,
									first_name: task.data.user.first_name || '',
									last_name : task.data.user.last_name || '',
									phone     : task.data.user.phone_number ? task.data.user.phone_number.replace('+', '') : ''
								}]
							})

							console.log('importContacts:',importContacts)


							let user;

							if(importContacts.users.length>0) {
								user = importContacts.users[0];
							}

							if(importContacts.users.length===0 && !task.data.user.username) {

								callbackTask.data.sent = false
								callbackTask.data.error_code = 1
								failure_ids.push(task._id.toString())

								callbackTasks.push(callbackTask)

								return setTimeout(()=>{taskCallback()})

							}

							if(importContacts.users.length===0 && task.data.user.username) {


								const search = await this.accounts[task.data.phone].call('contacts.search', {
									q:'@'+task.data.user.username,
									limit:30
								})

								console.log(search);

								if(search.users===0) {

									callbackTask.data.sent = false
									callbackTask.data.error_code = 2
									failure_ids.push(task._id.toString())

									callbackTasks.push(callbackTask)

									return setTimeout(()=>{taskCallback()})
								}

								const searched = search.users.find(el=>el.username===task.data.user.username)

								if(!searched){
									callbackTask.data.sent = false
									callbackTask.data.error_code = 3
									failure_ids.push(task._id.toString())

									callbackTasks.push(callbackTask)

									return setTimeout(()=>{taskCallback()})
								}

								user = searched
							}

							const sendMessage = await this.accounts[task.data.phone].call('messages.sendMessage', {
								peer	:{
									_: 'inputPeerUser',
									user_id: user.id,
									access_hash: user.access_hash
								},
								message:	task.data.user.first_name+', привет !  Если ты видишь это сообщение, то тестирование рассылки от Telegramer BOT прошло успешно. \n' +
									'\n' +
									'Но есть ещё кое-что. \n' +
									'\n' +
									'Хочешь продолжить ? \n' +
									'\n' +
									'Отправь мне любой текст в ответ.',
								random_id:	Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
								// phone:	user.phone ||''
							})

							console.log('sendMessage:', sendMessage)

							if(sendMessage._!=='updateShortSentMessage'){
								callbackTask.data.sent = false
								callbackTask.data.error_code = 4
								failure_ids.push(task._id.toString())

								callbackTasks.push(callbackTask)

								return setTimeout(()=>{taskCallback()})
							}

							callbackTask.data.sent = true
							success_ids.push(task._id.toString())

							callbackTasks.push(callbackTask)

							return setTimeout(()=>{taskCallback()})
						}



						if(task.data.user.imported){
							const importContact = await this.importContact(task.data.user, task.data.phone)

							if(importContact.status==='error'){
								callbackTask.sent = false
								failure_ids.push(task._id.toString())

								callbackTasks.push(callbackTask)

								return setTimeout(()=>{taskCallback()}, 1000)
							}
						}


						const contacts = await TgContacts.getAllByCondition({id:task.data.user.id, tg_account:task.data.phone})

						console.log("contacts:")
						console.log(contacts)



						if((!contacts || !contacts[0] || !contacts[0].access_hash) && !task.data.user.username){
							callbackTask.sent = false
							failure_ids.push(task._id.toString())

							callbackTasks.push(callbackTask)

							return setTimeout(()=>{taskCallback()}, 1000)
						}


						if((!contacts || !contacts[0] || !contacts[0].access_hash) && task.data.user.username){
							const importContact = await this.importContact(task.data.user, task.data.phone)

							console.log("importContact:")
							console.log(importContact)

							if(importContact.status==='error'){
								callbackTask.sent = false
								failure_ids.push(task._id.toString())

								callbackTasks.push(callbackTask)

								return setTimeout(()=>{taskCallback()}, 1000)
							}

							task.data.user.access_hash = importContact.contact.access_hash
						}



						if(contacts && contacts[0] && contacts[0].access_hash) {
							task.data.user.access_hash = contacts[0].access_hash
						}

						let d = await this.sendMessage(task.data)

						console.log('d:')
						console.log(d)


						if(d.status==='ok'){
							callbackTask.sent = true
							success_ids.push(task._id.toString())
						}
						else{
							callbackTask.sent = false
							failure_ids.push(task._id.toString())
						}

						callbackTasks.push(callbackTask)


						sendTasksController.updateMany({_id:{$in:success_ids}}, {status:'ok'}, result=>{
							console.log(result)
						})
						sendTasksController.updateMany({_id:{$in:failure_ids}}, {status:'error'}, result=>{
							console.log(result)
						})

						return setTimeout(()=>{taskCallback()}, 1000)
					})();
				},
				err=>{
					if(err){
						console.error(err)
					}

					sendTasksController.updateMany({_id:{$in:success_ids}}, {status:'ok'}, result=>{
						console.log(result)
					})
					sendTasksController.updateMany({_id:{$in:failure_ids}}, {status:'error'}, result=>{
						console.log(result)
					})

					callbackTasksController.createMany(callbackTasks, result=>{
						console.log(result)
					})


					return resolve()
				}
			)

		})
	}

	async importContact(contact, phone){
		return new Promise(async resolve=>{

			try{

				if(contact.username){
					const search = await this.accounts[phone].call('contacts.search', {
						q:'@'+contact.username,
						limit:30
					})


					console.log(search);

					await this.sleep(1000)

					if(search.users===0) {

						return resolve({status:'error'})
					}

					const searched = search.users.find(el=>el.username===contact.username)

					if(!searched){
						return resolve({status:'error'})
					}

					const user = searched

					const newContact = {
						id:user.id,
						access_hash:user.access_hash,
						first_name:user.first_name || '',
						last_name:user.last_name || '',
						username:user.username || '',
						phone:user.phone || '',
						tg_account:phone
					}

					return TgContacts.create(newContact, result=>{
						return resolve({status:'ok',contact: newContact})
					})
				}

				const importContact = await this.accounts[phone].call('contacts.importContacts', {
					// _:'inputPhoneContact',
					contacts:[{
						_         : 'inputPhoneContact',
						// 		client_id : Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
						client_id : contact.id,
						first_name: contact.first_name || '',
						last_name : contact.last_name || '',
						phone     : contact.phone ? contact.phone.replace('+', '') : ''
					}]
				})

				console.log('importContact')
				console.log(importContact)

				await this.sleep(1000)

				if(importContact.error_code){
					return resolve({status:'error'})
				}

				let user;
				if(importContact.users.length>0) {
					user = importContact.users[0];
				}

				const newContact = {
					id:user.id,
					access_hash:user.access_hash,
					first_name:user.first_name || '',
					last_name:user.last_name || '',
					username:user.username || '',
					phone:user.phone || '',
					tg_account:phone
				}

				return TgContacts.create(newContact, result=>{
					return resolve({status:'ok', contact: newContact})
				})


			}
			catch(e){
				console.log(e)

				resolve({status:'error'})
			}


		})
	}

	executeCallbackTasks(tasks){
		return new Promise(resolve=>{

			const success_ids = []
			const failure_ids = []
			// const callbackTasks = []

			return async.eachSeries(tasks, (task, taskCallback)=>{
					(async ()=>{
						let d = await this.sendRequest(task.data)

						// const callbackTask = {
						// 	data:task.data,
						// 	execute_time: moment().format('YYYY-MM-DD HH:mm:ss')
						// }

						if(d.status==='ok'){
							// callbackTask.sent = true
							success_ids.push(task._id.toString())
						}
						else{
							// callbackTask.sent = false
							failure_ids.push(task._id.toString())
						}

						// callbackTasks.push(callbackTask)

						return setTimeout(()=>{taskCallback()})
					})();
				},
				err=>{
					if(err){
						console.error(err)
					}

					callbackTasksController.updateMany({_id:{$in:success_ids}}, {status:'ok'}, result=>{
						console.log(result)
					})
					callbackTasksController.updateMany({_id:{$in:failure_ids}}, {status:'error'}, result=>{
						console.log(result)
					})

					// callbackTasksController.createMany(callbackTasks, result=>{
					// 	console.log(result)
					// })


					return resolve()
				}
			)

		})
	}

	async sendMessage(data){

		console.log(data)

		return new Promise(async resolve=>{

			try{
			const addContact = await this.accounts[data.phone].call('contacts.addContact', {
				id	:{
					_: 'inputPeerUser',
					user_id: data.user.id,
					access_hash: data.user.access_hash
				},
				first_name:	data.user.first_name || 'Тест',
				last_name:	data.user.last_name || '',
				phone:	data.user.phone ||''
			})


			console.log({
				id	:{_: 'inputUser',
					user_id: data.user.id,
					access_hash: data.user.access_hash
				},
				first_name:	data.user.first_name || 'Тест',
				last_name:	data.user.last_name || '',
				phone:	data.user.phone ||''
		})
			console.log('addContactasd: ', addContact)


			const sendMessage = await this.accounts[data.phone].call('messages.sendMessage', {
				peer	:{
					_: 'inputPeerUser',
					user_id: data.user.id,
					access_hash: data.user.access_hash
				},
				message:	data.message,
				random_id:	Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
				// phone:	user.phone ||''
			})

			console.log('sendMessageasd: ', sendMessage)

			if(sendMessage._!=='updateShortSentMessage'){

				console.error(sendMessage)

				return resolve({status:'error'})
			}

			return resolve({status:'ok'})

			}catch (e){
				console.log(e)

				return resolve({status:'ok'})
			}

		})
	}

	sendRequest(data){
		return new Promise(resolve => {
			return request({
				url:'https://pay.telegramer.bot/mailing_callbacks',
				method:'POST',
				headers:{'Content-Type':'application/json'},
				body:JSON.stringify(data)
			}, (error,  httpResponse, body)=>{
				console.error(error)
				// console.log(httpResponse)
				console.log(body)

				if(error){
					return resolve({status:'error'})
				}

				return resolve({status:'ok'})
			})
		})
	}

}

const SpammerCls = new Spammer()

module.exports = SpammerCls