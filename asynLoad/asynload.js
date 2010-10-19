(function ($) {
	/** Dynamically load js
	 * @param jsname {String} the js' filename. Separate mulitple js by spaces.
	 * @param [path] {String} script's URL.
	 * @param [callback] {Function} callback function executed when the js files had been loaded. If included, it must be the last parameter.
	 * @example
	 * $.use('test',function(){...});
	 * $.use('test test2',function(){...});
	 * $.use('test','http://cdn.example.com/scripts/',function(){...});
	 */
	var _mods = {},	 //js files object:element,state,callback
		_fns = {},	//callbacks store
		_config = {
			'path':{	//default resource url
				'js':'',
				'css':''
			},
			'basefile':'',	//base required js file
			'separate':' '	//use space split js
		},
		_state = {
			loading:'loading',
			loaded:'loaded'
		};
	/*--
	window.myfns = _fns;
	window.mymods = _mods;
	 --*/

	var _uniqueJS = function (arr) {	//unique array(string content)
			var sp = '~'+new Date().getTime()+'~',
				rgx = new RegExp('((?:.|\\n)'+sp+')\\1*','gi'),
				str = arr.join(sp)+sp,
				rs = str.replace(rgx,'$1').slice(0,-sp.length).split(sp);
			return rs;
		},
		//create new element
		_addElement = function (jss,modName,filetype,callback) {
			_mods[modName] = {
				'state':_state['loading'],
				'callback':[]	//queue of callback
			};
			var mod = _mods[modName];
			if(typeof(callback) === 'function') {
				(mod.callback).push(callback);
			}
			var c = function () {
				mod.state = _state['loaded'];
				 _timedChunk(mod.callback,function () {
					 _doCallback(jss,modName,mod.callback[0],0);
				 });
			};
			_createElement(modName,filetype,c);
		},
		_createElement = function (root,filetype,callback) {
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				tag = {
					'css':'link',
					'js':'script'
				},
				srcName = {
					'css':'href',
					'js':'src'
				},
				ele = document.createElement(tag[filetype]);
			ele.async = true;	//fix firefox3.6
			ele[srcName[filetype]||'src'] = root;
			if(filetype==='css') {
				ele.rel = 'stylesheet';
			}

			ele.onload = ele.onreadystatechange = function (e) {
				e = window.event || e;
				//IE fires both events when inclusion css file
				if((e.type === 'readystatechange' && (ele.readyState==='loaded'||ele.readyState==='complete') && filetype !== 'css' ) || (e.type === 'load')) {
					callback();
					// Handle memory leak in IE
					ele.onload = ele.onreadystatechange = null;
					if (head && ele.parentNode && filetype !== 'css') {
						head.removeChild(ele);
					}
				}
			};

			/*--
			//Gecko and WebKit don't support the onload event on link nodes
			//console.log(ele,ele.onload.type,ele.onreadystatechange.type);
			if(filetype === 'css' && !ele.readyState) {
				var fixCssLoad = setInterval(function () {
					if(ele.sheet) {
						clearInterval(fixCssLoad);
						callback();
					}
				},10);
			}
			 --*/

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709 and #4378).
			head.insertBefore(ele, head.firstChild);
		},
		//add callback to mod
		_addCallback = function (modName,callback) {
			if(typeof(callback) === 'function') {
				(_mods[modName].callback).push(callback);
			}
		},
		//execute callback
		_doCallback = function (jss,modName,callback,sn) {
			var finalSn = sn;
			if(sn!==undefined) {
				_mods[modName].callback.splice(sn,1);
			}
			if(typeof(callback) === 'function') {
				var key = ':'+callback,
					rgx = new RegExp('[\\b]*'+modName+'[\\b]*','gim');
				if(_fns[key]) {
					_fns[key] = _fns[key]*1 - 1;
					if(_fns[key] === 0) {
						callback();
						delete _fns[key];
					}
				}
			}
			return finalSn;
		},
		_isUrl = function (url) {//strongly,must content protocol
			var rgx = /^(((?:https?|ftp|news):)?\/\/)([a-z]([a-z0-9\-]*\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-z][a-z0-9_]*)?$/;
			return rgx.test(url);
		},
		_parsePath = function (file,filetype) {
			var rgx = new RegExp('(\\.'+filetype+')+$','gim');
			var rs = _isUrl(file)?file:(_config.path[filetype]+file+'.'+filetype).replace(rgx,'$1');
			return rs;
		},
		_getFiletype = function (file) {
			var pathname = file.split('?')[0],
				rgx = /\.(\w{1,8})$/,
				filetype;
			filetype = pathname.match(rgx);
			filetype = (filetype&&filetype.length>1)?filetype[1].toLowerCase():undefined;
			return filetype;
		},
		_timedChunk = function(items, process, context, callback) {
			var todo = items.concat(), delay = 25;

			setTimeout(function() {
				var start = +new Date();

				do {
				process.call(context, todo.shift());
				} while(todo.length > 0 && (+new Date() - start < 50));

				if(todo.length > 0) {
					setTimeout(arguments.callee, delay);
				} else if(callback) {
					callback(items);
				}

			}, delay);
		};

	$.extend({
		use:function () {
			var args = [].slice.call(arguments),
				jsStr = $.trim((typeof(args[0]) === 'function')?_config.basefile:(_config.basefile+_config.separate+args[0])),	//js file string
				//path = (!args[1] || typeof(args[1]) === 'function')?_config.path:args[1],	//custom or default js path
				filetype = (!args[1] || typeof(args[1]) === 'function')?undefined:args[1].toLowerCase(),	 //file type, js or css, default is js
				callback = (typeof(args[args.length-1]) !== 'function')?undefined:args[args.length-1],	//callback
				jsArr = _uniqueJS(jsStr.split(_config.separate)),	//js file array
				fnkey = ':'+callback,
				curfn = _fns[fnkey];
			jsStr = jsArr.join(_config.separate);
			if(callback) {
				_fns[fnkey] = curfn?curfn*1+jsArr.length:jsArr.length;	//store callback require js file
			}

			var i=0, l = jsArr.length;
			for(; i < l; ++i) {
				var file = jsArr[i]+'',
					mod;
					//mod = _mods[file];
				filetype = filetype||_getFiletype(file)||'js';	//default filetype: js
				file = _parsePath(file,filetype);
				mod = _mods[file];
				if(!mod) {	//create new
					//console.log('create new:'+file);
					_addElement(jsStr,file,filetype,callback);
				}else if(mod && mod.state === _state['loading']) {	//js loading
					//console.log('loading:'+file);
					_addCallback(file,callback);
				}else if(mod && mod.state === _state['loaded']) {	//js loaded
					//console.log('loaded:'+file);
					_doCallback(jsStr,file,callback);
				}
			}
		}
	});

})(jQuery);