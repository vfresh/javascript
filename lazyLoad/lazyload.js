$.fn.extend({
	  lazyLoad:(function () {
		  var _mode = {
				AUTO:'auto',
				MANUAL:'manual'	//default mode
			  },
			  _options = {
				attribute:'lazyload-src',
				mode:_mode.MANUAL,
				pixelfix:'http://cdn1.everydaysource.com/cdn/web/everydaysource/20101014/images/' + 'error/pixel.gif'
			};

		  var _class = {
			init:function (container,mode,pixelfix) {
				this.container = container;
				this.pixelfix = pixelfix || _options.pixelfix;
				this.mode = (mode || _options.mode).toLowerCase();

				this.images = this.filterImages();

				if(this.images.length>0) {
					this.initLoadEvent();
				}
			},
			initLoadEvent:function () {
				var fn,
					s = this,
					check = function (e) {
						if(fn) {return false;}

						//less times execute loadImage()
						var evType = e.type;	 //event type
						if(evType === 'scroll') {
							var nowScrolled = $(window).scrollTop(),
								lastScrolled = s.lastScrolled;
							if(lastScrolled && lastScrolled > nowScrolled) {
								return false;
							}
							s.lastScrolled = nowScrolled;
						}else if(evType === 'resize') {
							s.lastScrolled = 0;
							var nowHeight = $(window).height(),
								lastHeight = s.winViewedHeight;
							if(lastHeight && lastHeight>nowHeight) {
								return false;
							}
							s.winViewedHeight = nowHeight;
						}

						fn = setTimeout(function () {
							s.loadImage();
							if(s.images.length===0) {	//unbind onscroll,onresize
								$(window).unbind('scroll resize',check);
							}
							fn = null;
						},100);
					};

				$(function () {	//dom ready
					s.loadImage();
				});

				$(window).bind('scroll resize',check);
			},
			filterImages:function () {
				var imgs = [],
					container = this.container,
					attrName = _options.attribute,
					isAuto = this.mode===_mode.AUTO,
					selector = isAuto?'img:not(['+attrName+'])':'img['+attrName+']';

				imgs = $(container).find(selector);

				if(isAuto) {	//auto replace src
					imgs.attr(attrName,function () {
						return this.src;
					}).attr('src',this.pixelfix);
				}
				return imgs;
			},
			loadImage:function () {
				var s = this,
					imgs = s.images,
					attrName = _options.attribute,
					noShow = [],
					scrolltop = s.lastScrolled || $(window).scrollTop(),
					stop = scrolltop + (s.winViewedHeight||$(window).height());

				var i=0,cur;
				for(;cur=imgs[i++];) {
					if(stop > $(cur).offset().top) {
						cur.setAttribute('src',cur.getAttribute(attrName));
						cur.removeAttribute(attrName);
					}else {
						noShow.push(cur);
					}
				}
				this.images = noShow;
			}
		  };

		  var LAZY = function (container,mode,pixelfix) {
			if(!(this instanceof arguments.callee)){
				return new arguments.callee(container,mode,pixelfix);
			}

			this.init(container,mode,pixelfix);
		  };
		  LAZY.prototype = _class;

		  return function (mode,pixelfix) {
			  return this.each(function () {
				LAZY(this,mode,pixelfix);
			  });
		  };
	  })()
});