/*! javascrip for Web SQL Database */

/**
 * var sql = JSQL(); //初始化sql
 */

(function (window) {
	var _option = {
		dbname = 'JSQL_DOCUMENT'	//默认的数据库名
	};

	var  _db = {},
		JSQL = function (dbname,dbver,dbdesc,dbsize,callback) {
			dbname = dbname || _option.dbname;
			dbver = dbver || '1.0';
			dbdesc = dbdesc || '';
			dbsize = dbsize || 5 * 1024 * 1024;
			callback = callback || function () {};
			var db = _db[dbname] || new JSQL.fn.init(dbname,dbver,dbdesc,dbsize,callback);
			return db;
		},
		document = window.document,
		push = Array.prototype.push,
		slice = Array.prototype.slice,
		_excute = function (obj,fn) {
			fn.call(obj[0]);
			return obj;
		};

	JSQL.fn = JSQL.prototype = {
		init:function () {
			var db = openDatabase.apply(null,arguments);
			push.call(this,db);
			_db[arguments[0]] = this;
			return this;
		},
		/**
		 * @param
		 */
		'getdisk':function () {
		},
		/** 执行sql语句
		 * @param sql 需要执行的sql语句
		 */
		'executeSql':function (sql) {
			return _excute(this,function () {
				this.transaction(function (s) {
					s.executeSql(sql);
				});
			});
		},
		/** 建立表格
		 * @param tableName 表名
		 * @param colstr 表列字符串，示例：'id INTEGER PRIMARY KEY, title TEXT NOT NULL'
		 */
		'create':function (tableName,colstr) {
			return _excute(this,function () {
				this.transaction(function (s) {
					s.executeSql('CREATE TABLE IF NOT EXISTS '+tableName+' ('+colstr+')');
				});
			});
		},
		/** 插入数据
		 * @param
		 * @example JSQL().insert(tableName,jsonData [,jsonData...]);
		 */
		'insert':function () {
			var args = slice.call(arguments),
				tableName = args[0],
				jsondata = args.slice(1),
				len = jsondata && jsondata.length,
				datas = [],
				strData = function (s) {
					var key = [],val = [];
					for(var i in s) {
						key.push(i);
						val.push(typeof(s[i])==='number'?s[i]:'"'+s[i]+'"');
					}
					key = key.join(',');
					val = val.join(',');
					return [key,val];
				};

			if(len && len>0) {
				do {
					datas.push(strData(jsondata.shift()));
				} while(jsondata.length > 0);
			}

			return _excute(this,function () {
				this.transaction(function (s) {
					var i=0, l = datas.length;
					for(; i < l; ++i) {
						console.log('INSERT INTO '+tableName+' ('+datas[i][0]+') VALUES ('+datas[i][1]+')');
						s.executeSql('INSERT INTO '+tableName+' ('+datas[i][0]+') VALUES ('+datas[i][1]+')');
					}
				});
			});
		},
		/** 获取数据
		 * @param
		 */
		'getData':function (tableName) {
			return _excute(this,function () {
				this.transaction(function (s) {
					s.executeSql('SELECT * FROM '+tables[i],[],function (tx, results) {
						var len = results.rows.length,
							i,
							rs;
						console.log(results);
						for (i = 0; i < len; i++) {
						}
					});
				});
			});
		},
		/** 删除表格
		 * @param
		 * @example
		 * JSQL().drop('table1','table2','table3');
		 */
		'drop':function () {
			var tables = slice.call(arguments),
				len = tables.length;
			return _excute(this,function () {
				this.transaction(function (s) {
					if(len>1) {
						var i=0;
						for(; i < len; ++i) {
							s.executeSql('DROP TABLE IF EXISTS '+tables[i]);
						}
					}else {
						s.executeSql('DROP TABLE IF EXISTS '+tables[0]);
					}
				});
			});
		},
		'delete':function () {
			return _excute(this,function () {
				this.transaction(function (s) {
					s.executeSql('');
				});
			});
		}
	};
	JSQL.fn.init.prototype = JSQL.fn;

	window.JSQL = JSQL;
})(window);