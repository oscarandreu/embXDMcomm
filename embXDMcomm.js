/**
 * @name        embXDMcomm v1.0.0 
 * @description Cross domain communication.  
 * @author      Óscar Andreu Martínez, David López Rguez
 *
 * Copyright © 2013 UNIQ GROUP Ltd.
 */
(function($){var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h];$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}})(jQuery);
(function($, window) {
    /**
     * bqXDMComm provides the functions for cross domain communication.
     */
	var bqXDMComm = function() {
		this.onStateId = null;
		this.lastState = {};
        $("body").addClass("popup");

	};
	bqXDMComm.Cfg = {
		/* The parent property returns the parent window of the current window. */
		target : parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined)
	};
	bqXDMComm.prototype = {
		/**
		 * Initialization method. Subscribe to receive message of window parent.
		 * The message that receive must have three properties:
		 * - (String) request.
		 * - (Strint) event.
		 * - (Object) data. Is optional
		 */
		init : function() {
			var context = this;
			
			$.receiveMessage( function(data) {
				var message = JSON.parse(data.data);
				if (!message || !message.hasOwnProperty('request') || !message.hasOwnProperty('event')) {
					return;
				}
				var element = message.hasOwnProperty('element') ? message.element : 'body';
				switch (message.request) {
					case 'onState':
						if (context.onStateId) {
							return;
						}				
                        $("body").removeClass("popup");
						context.onStateId = setInterval(function() {
							var state = context.getState(element);
							if (JSON.stringify(context.lastState) === JSON.stringify(state)) {
								return;
							}
							
							context.lastState = state;
							context.sendResponse(context.lastState, message.event);
						}, 500);						
						break;						
					
					case 'onBeforeUnload': 
						$(window).bind('beforeunload', function() {
							context.sendResponse(context.lastState, message.event);
						});
						break;
					
					case 'offState':
						if (context.onStateId) {
							clearInterval(context.onStateId);
						}
						break;
						
					case 'getState':
						context.sendResponse(context.getState(element), message.event);
						break;						
				
					case 'setStyle':
						for (var i in message.data) {
							$(message.data[i].selectors).css(message.data[i].css);
						}
						break;					
				
					case 'toggleClass':
						for (var i in message.data) {
							$(message.data[i].selectors).toggleClass(message.data[i].toggleClass);
						}
						break;
						
					case 'reload':
						window.location.href = message.data;
						break;
                        
                    case 'logout':	
                        var cookies = document.cookie.split(";");
						for(var i=0; i < cookies.length; i++) {
							var equals = cookies[i].indexOf("=");
							var name = equals > -1 ? cookies[i].substr(0, equals) : cookies[i];
							document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
						}
                        window.location.reload(true);
						break;
				}
			});
		},
		
		/**
		 * Send the response to the parent window.
		 * @param {Object} response
		 * @param {String} event
		 */
		sendResponse : function(response, event) {
			if (!event) {
				return;
			}
			
			var msg = {
				response : response, 
				event    : event
			};		
			$.postMessage(JSON.stringify(msg), "*", bqXDMComm.Cfg.target);   
		},
		
		/**
		 * Return the iframe state.
		 * @returns {Object) state
		 */
		getState : function(element) {
			return {
				height : $(element).outerHeight(),
				width  : $(element).outerWidth(),
				href   : $(location).attr('href')
			};
		}		
	};
	
	
	$(document).ready(function() {		
		if (!window.bqXDMComm) {
			window.bqXDMComm = new bqXDMComm();
			window.bqXDMComm.init();
		}
	});	
})(jQuery, window);
