

module.exports =  class MainController{
	constructor(model){
		this.model = model

		// console.log(this.model)
	}

	/**
	 * созданик документа
	 * @param object - Объект документа
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	create(object, callback) {
		// console.log(this.model)

		return new Promise(resolve =>{

			if(!callback){
				callback = ()=>{}
			}

			const model = new this.model(object);

			model.save(err => {

				if(err){
					callback({
						error: err
					});
					return resolve({
						error: err
					});

				}

				callback(model);
				return resolve(model);
			});
		});
	}

	/**
	 * содание массива документов
	 * @param array - Массви документов
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	createMany(array, callback) {
		return new Promise(resolve =>{

			if(!callback){
				callback = ()=>{}
			}

			this.model.insertMany(array,err => {

				if(err){
					callback({
						error: err
					});
					return resolve({
						error: err
					});
				}
				callback(array);
				return resolve(array);
			});
		});
	}


	/**
	 * Инкремент
	 * @param condition - Условие выборки записей
	 * @param update - объект аргументов для инкрементирования
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	increment(condition, update, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.findOneAndUpdate(
				condition,
				{$inc: update},
				{new: true},
				(err, doc) => {

					if (err) {
						callback({
							error: err
						});
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Обновление документа
	 * @param condition - объект условия
	 * @param update - объект аргументов которые требуется обновить
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	update(condition, update, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.findOneAndUpdate(
				condition,
				{$set: update},
				{new: true},
				(err, doc) => {

					if (err) {
						callback({
							error: err
						})
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Обновление массива документов
	 * @param condition - объект условия выборки
	 * @param update - объект аргументов которые требуется обновить
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	updateMany(condition, update, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}
			this.model.updateMany(
				condition,
				{$set: update},
				(err, doc) => {

					if (err) {
						resolve({
							error: err
						});
						return callback({
							error: err
						});
					}

					resolve(doc)
					return callback(doc)
				}
			);
		});
	}

	/**
	 * Выбока документов по условию
	 * @param condition - объект условия
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	getAllByCondition(condition, callback) {
		console.log('getAllByCondition')
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.find(condition,
				(err, doc) => {

					if (err) {
						callback({
							error: err
						})
						return resolve({
							error: err
						})
					}
					callback(doc)
					return resolve(doc)
				}
			)
		})
	}

	/**
	 * Выборка документов с доп опциями
	 * @param condition - объект условия
	 * @param options - объект опций
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	getAllByConditionWithOptions(condition, options, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.find(condition, null, options,
				(err, doc) => {

					if (err) {
						callback({
							error: err
						})
						return resolve({
							error: err
						})
					}
					callback(doc)
					return resolve(doc)
				}
			)
		})
	}

	/**
	 * Обновление документа с добавление данных в массив
	 * @param condition - объект условия выборки
	 * @param update - объект аргументов которые требуется обновить
	 * @param push - объект с названием пополняемого массива и значением которое требуется туда внести
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	updateWithPushInArray(condition, update, push, callback){

		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.updateOne(
				condition,
				{
					$set : update,
					$push: push
				},
				{new: true},
				(err, doc) => {
					// _mongoError(err)
					if (err) {
						callback({
							error: err
						});
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Обновление массива документов с добавление данных в массив
	 * @param condition - объект условия выборки
	 * @param update - объект аргументов которые требуется обновить
	 * @param push - объект с названием пополняемого массива и значением которое требуется туда внести
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	updateManyWithPushInArray(condition, update, push, callback){

		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.updateMany(
				condition,
				{
					$set : update,
					$push: push
				},
				{new: true},
				(err, doc) => {

					console.log(err)
					console.log(doc)
					// _mongoError(err)
					if (err) {
						callback({
							error: err
						});
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Обновление массива документов с исключением данных из массив
	 * @param condition - объект условия выборки
	 * @param update - объект аргументов которые требуется обновить
	 * @param pull - объект с названием массива и значением которое требуется оттуда исключить
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	updateManyWithPullFromArray(condition, update, pull, callback){

		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.updateMany(
				condition,
				{
					$set : update,
					$pull: pull
				},
				{new: true},
				(err, doc) => {
					// _mongoError(err)
					if (err) {
						callback({
							error: err
						});
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Обновление массива документов с исключением и добавлением данных в массивах
	 * @param condition - объект условия выборки
	 * @param update - объект аргументов которые требуется обновить
	 * @param push - объект с названием пополняемого массива и значением которое требуется туда внести
	 * @param pull - объект с названием массива и значением которое требуется оттуда исключить
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	updateManyWitPushAndPull(condition, update, push, pull, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.updateMany(
				condition,
				{
					$set : update,
					$push: push,
					$pull: pull
				},
				{new: true},
				(err, doc) => {
					// _mongoError(err)
					if (err) {
						callback({
							error: err
						});
						return resolve({
							error: err
						});
					}
					callback(doc)
					return resolve(doc)
				}
			);
		});
	}

	/**
	 * Удаление документа
	 * @param condition - объект условия выборки
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	deleteOne(condition, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}

			this.model.deleteOne(condition, (err) => {

				if (err) {
					callback({
						error: err
					});
					return resolve({
						error: err
					});
				}
				callback({
					status: 'ok',
				});
				return resolve({
					status: 'ok',
				});
			});
		});
	}

	/**
	 * Удаление массива документов по условию
	 * @param condition - объект условия
	 * @param callback
	 * @returns {Promise<unknown>}
	 */
	deleteMany(condition, callback){
		return new Promise(resolve => {

			if (!callback) {
				callback = () => {
				}
			}
			this.model.deleteMany(condition, (err) => {

				if (err) {
					callback({
						error: err
					});
					return resolve({
						error: err
					});
				}
				callback({
					status: 'ok',
					data: ''
				})
				return resolve({
					status: 'ok',
					data: ''
				})
			})
		})
	}

}