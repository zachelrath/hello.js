/**
 * @hello.js
 *
 * HelloJS is a client side Javascript SDK for making OAuth2 logins and subsequent REST calls.
 *
 * @author Andrew Dodson
 * @company Knarly
 *
 * @copyright Andrew Dodson, 2012 - 2014
 * @license MIT: You are free to use and modify this code for any use, on the condition that this copyright notice remains.
 */

// Can't use strict with arguments.callee
//"use strict";


define([
	'utils/append',
	'utils/args',
	'utils/clone',
	'utils/dataToJSON',
	'utils/diff',
	'utils/event',
	'utils/extend',
	'utils/globalEvent',
	'utils/hasBinary',
	'utils/isEmpty',
	'utils/jsonp',
	'utils/merge',
	'utils/objectCreate',
	'utils/param',
	'utils/post',
	'utils/qs',
	'utils/realPath',
	'utils/store',
	'utils/unique',
	'utils/xhr'
],function(

	append,
	args,
	clone,
	dataToJSON,
	diff,
	Event,
	extend,
	globalEvent,
	hasBinary,
	isEmpty,
	jsonp,
	merge,
	objectCreate,
	param,
	post,
	qs,
	realPath,
	store,
	unique,
	xhr

){


//
// Setup
// Initiates the construction of the library

var hello = function(name){
	return hello.use(name);
};



/////////////////////////////////////////////////
// Core library
// This contains the following methods
// ----------------------------------------------
// init
// login
// logout
// getAuthRequest
/////////////////////////////////////////////////

extend( hello, {

	//
	// Options
	settings : {

		//
		// OAuth 2 authentication defaults
		redirect_uri  : window.location.href.split('#')[0],
		response_type : 'token',
		display       : 'popup',
		state         : '',

		//
		// OAuth 1 shim
		// The path to the OAuth1 server for signing user requests
		// Wanna recreate your own? checkout https://github.com/MrSwitch/node-oauth-shim
		oauth_proxy   : 'https://auth-server.herokuapp.com/proxy',

		//
		// API Timeout, milliseconds
		timeout : 20000,

		//
		// Default Network
		default_service : null,

		//
		// Force signin
		// When hello.login is fired, ignore current session expiry and continue with login
		force : true
	},


	//
	// Service
	// Get/Set the default service
	//
	service : function(service){

		//this.warn("`hello.service` is deprecated");

		if(typeof (service) !== 'undefined' ){
			return store( 'sync_service', service );
		}
		return store( 'sync_service' );
	},


	//
	// Services
	// Collection of objects which define services configurations
	services : {},

	//
	// Use
	// Define a new instance of the Hello library with a default service
	//
	use : function(service){

		// Create self, which inherits from its parent
		var self = objectCreate(this);

		// Inherit the prototype from its parent
		self.settings = objectCreate(this.settings);

		// Define the default service
		if(service){
			self.settings.default_service = service;
		}

		// Create an instance of Events
		Event.call(self);

		return self;
	},


	//
	// init
	// Define the clientId's for the endpoint services
	// @param object o, contains a key value pair, service => clientId
	// @param object opts, contains a key value pair of options used for defining the authentication defaults
	// @param number timeout, timeout in seconds
	//
	init : function(services,options){

		if(!services){
			return this.services;
		}

		// Define provider credentials
		// Reformat the ID field
		for( var x in services ){if(services.hasOwnProperty(x)){
			if( typeof(services[x]) !== 'object' ){
				services[x] = {id : services[x]};
			}
		}}

		//
		// merge services if there already exists some
		this.services = merge(this.services, services);

		//
		// Format the incoming
		for( x in this.services ){if(this.services.hasOwnProperty(x)){
			this.services[x].scope = this.services[x].scope || {};
		}}

		//
		// Update the default settings with this one.
		if(options){
			this.settings = merge(this.settings, options);

			// Do this immediatly incase the browser changes the current path.
			if("redirect_uri" in options){
				this.settings.redirect_uri = realPath(options.redirect_uri);
			}
		}

		return this;
	},


	//
	// Login
	// Using the endpoint
	// @param network	stringify				name to connect to
	// @param options	object		(optional)	{display mode, is either none|popup(default)|page, scope: email,birthday,publish, .. }
	// @param callback	function	(optional)	fired on signin
	//
	login :  function(){

		// Create self
		// An object which inherits its parent as the prototype.
		// And constructs a new event chain.
		var self = this.use();

		// Get parameters
		var p = args({network:'s', options:'o', callback:'f'}, arguments);

		// Apply the args
		self.args = p;

		// Local vars
		var url;

		// merge/override options with app defaults
		var opts = p.options = merge(self.settings, p.options || {} );

		// Network
		p.network = self.settings.default_service = p.network || self.settings.default_service;

		//
		// Bind listener
		self.on('complete', p.callback);

		// Is our service valid?
		if( typeof(p.network) !== 'string' || !( p.network in self.services ) ){
			// trigger the default login.
			// ahh we dont have one.
			self.emitAfter('error complete', {error:{
				code : 'invalid_network',
				message : 'The provided network was not recognized'
			}});
			return self;
		}

		//
		var provider  = self.services[p.network];

		//
		// Callback
		// Save the callback until state comes back.
		//
		var responded = false;

		//
		// Create a global listener to capture events triggered out of scope
		var callback_id = globalEvent(function(obj){

			//
			// Cancel the popup close listener
			responded = true;

			//
			// Handle these response using the local
			// Trigger on the parent
			if(!obj.error){

				// Save on the parent window the new credentials
				// This fixes an IE10 bug i think... atleast it does for me.
				store(obj.network,obj);

				// Trigger local complete events
				self.emit("complete success login auth.login auth", {
					network : obj.network,
					authResponse : obj
				});
			}
			else{
				// Trigger local complete events
				self.emit("complete error failed auth.failed", {
					error : obj.error
				});
			}
		});



		//
		// QUERY STRING
		// querystring parameters, we may pass our own arguments to form the querystring
		//
		p.qs = {
			client_id	: provider.id,
			response_type : opts.response_type,
			redirect_uri : opts.redirect_uri,
			display		: opts.display,
			scope		: 'basic',
			state		: {
				client_id	: provider.id,
				network		: p.network,
				display		: opts.display,
				callback	: callback_id,
				state		: opts.state,
				oauth_proxy : opts.oauth_proxy
			}
		};

		//
		// SESSION
		// Get current session for merging scopes, and for quick auth response
		var session = store(p.network);

		//
		// SCOPES
		// Authentication permisions
		//
		var scope = opts.scope;
		if(scope && typeof(scope)!=='string'){
			scope = scope.join(',');
		}
		scope = (scope ? scope + ',' : '') + p.qs.scope;

		// Append scopes from a previous session
		// This helps keep app credentials constant,
		// Avoiding having to keep tabs on what scopes are authorized
		if(session && "scope" in session){
			scope += ","+session.scope.join(",");
		}
		// Save in the State
		p.qs.state.scope = unique( scope.split(/[,\s]+/) );

		// Map replace each scope with the providers default scopes
		p.qs.scope = scope.replace(/[^,\s]+/ig, function(m){
			return (m in provider.scope) ? provider.scope[m] : '';
		}).replace(/[,\s]+/ig, ',');

		// remove duplication and empty spaces
		p.qs.scope = unique(p.qs.scope.split(/,+/)).join( provider.scope_delim || ',');




		//
		// FORCE
		// Is the user already signed in with the appropriate scopes, valid access_token?
		//
		if(opts.force===false){

			if( session && "access_token" in session && session.access_token && "expires" in session && session.expires > ((new Date()).getTime()/1e3) ){
				// What is different about the scopes in the session vs the scopes in the new login?
				var _diff = diff( session.scope || [], p.qs.state.scope || [] );
				if(_diff.length===0){

					// Nothing has changed
					self.emit("notice", "User already has a valid access_token");

					// Ok trigger the callback
					self.emitAfter("complete success login", {
						network : p.network,
						authResponse : session
					});

					// Nothing has changed
					return self;
				}
			}
		}

		//
		// REDIRECT_URI
		// Is the redirect_uri root?
		//
		p.qs.redirect_uri = realPath(p.qs.redirect_uri);

		// Add OAuth to state
		if(provider.oauth){
			p.qs.state.oauth = provider.oauth;
		}

		// Convert state to a string
		p.qs.state = JSON.stringify(p.qs.state);


		// Bespoke
		// Override login querystrings from auth_options
		if("login" in provider && typeof(provider.login) === 'function'){
			// Format the paramaters according to the providers formatting function
			provider.login(p);
		}



		//
		// URL
		//
		if( parseInt(provider.oauth.version,10) === 1 ){
			// Turn the request to the OAuth Proxy for 3-legged auth
			url = qs( opts.oauth_proxy, p.qs );
		}
		else{
			url = qs( provider.oauth.auth, p.qs );
		}

		self.emit("notice", "Authorization URL " + url );


		//
		// Execute
		// Trigger how we want self displayed
		// Calling Quietly?
		//
		if( opts.display === 'none' ){
			// signin in the background, iframe
			append('iframe', { src : url, style : {position:'absolute',left:"-1000px",bottom:0,height:'1px',width:'1px'} }, 'body');
		}


		// Triggering popup?
		else if( opts.display === 'popup'){

			var windowHeight = opts.window_height || 550;
			var windowWidth = opts.window_width || 500;

			// Help the minifier
			var documentElement = document.documentElement;
			var screen = window.screen;

			// Multi Screen Popup Positioning (http://stackoverflow.com/a/16861050)
			//   Credit: http://www.xtf.dk/2011/08/center-new-popup-window-even-on.html
			// Fixes dual-screen position                         Most browsers      Firefox
			var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
			var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

			var width = window.innerWidth || documentElement.clientWidth || screen.width;
			var height = window.innerHeight || documentElement.clientHeight || screen.height;

			var left = ((width - windowWidth) / 2) + dualScreenLeft;
			var top  = ((height - windowHeight) / 2) + dualScreenTop;

			// Trigger callback
			var popup = window.open(
				//
				// OAuth redirect, fixes URI fragments from being lost in Safari
				// (URI Fragments within 302 Location URI are lost over HTTPS)
				// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
				// 
				// FIREFOX, decodes URL fragments when calling location.hash. 
				//  - This is bad if the value contains break points which are escaped
				//  - Hence the url must be encoded twice as it contains breakpoints.
				p.qs.redirect_uri + "#oauth_redirect=" + encodeURIComponent(encodeURIComponent(url)),
				'Authentication',
				"resizeable=true,height=" + windowHeight + ",width=" + windowWidth + ",left=" + left + ",top="  + top
			);

			// Ensure popup window has focus upon reload, Fix for FF.
			popup.focus();

			var timer = setInterval(function(){
				if(popup.closed){
					clearInterval(timer);
					if(!responded){
						self.emit("complete failed error", {error:{code:"cancelled", message:"Login has been cancelled"}, network:p.network });
					}
				}
			}, 100);
		}

		else {
			window.location = url;
		}

		return self;
	},


	//
	// Logout
	// Remove any data associated with a given service
	// @param string name of the service
	// @param function callback
	//
	logout : function(s, callback){

		var p = args({name:'s', callback:"f" }, arguments);

		// Create self
		// An object which inherits its parent as the prototype.
		// And constructs a new event chain.
		var self = this.use();

		// Add callback to events
		self.on('complete', p.callback);

		// Netowrk
		p.name = p.name || self.settings.default_service;

		if( p.name && !( p.name in self.services ) ){
			self.emitAfter("complete error", {error:{
				code : 'invalid_network',
				message : 'The network was unrecognized'
			}});
			return self;
		}
		if(p.name && store(p.name)){

			// Trigger a logout callback on the provider
			if(typeof(self.services[p.name].logout) === 'function'){
				self.services[p.name].logout(p);
			}

			// Remove from the store
			store(p.name,'');
		}
		else if(!p.name){
			for(var x in self.services){if(self.services.hasOwnProperty(x)){
				self.logout(x);
			}}
			// remove the default
			self.service(false);
			// trigger callback
		}
		else{
			self.emitAfter("complete error", {error:{
				code : 'invalid_session',
				message : 'There was no session to remove'
			}});
			return self;
		}

		// Emit events by default
		self.emitAfter("complete logout success auth.logout auth", {network:p.name});

		return self;
	},



	//
	// getAuthResponse
	// Returns all the sessions that are subscribed too
	// @param string optional, name of the service to get information about.
	//
	getAuthResponse : function(service){

		// If the service doesn't exist
		service = service || this.settings.default_service;

		if( !service || !( service in this.services ) ){
			this.emit("complete error", {error:{
				code : 'invalid_network',
				message : 'The network was unrecognized'
			}});
			return null;
		}

		return store(service) || null;
	},


	//
	// Events
	// Define placeholder for the events
	events : {}
});




//////////////////////////////////
// Events
//////////////////////////////////

// Extend the hello object with its own event instance
Event.call(hello);



///////////////////////////////////
// Monitoring session state
// Check for session changes
///////////////////////////////////

(function(hello){

	// Monitor for a change in state and fire
	var old_session = {},

		// Hash of expired tokens
		expired = {};

	//
	// Listen to other triggers to Auth events, use these to update this
	//
	hello.on('auth.login, auth.logout', function(auth){
		if(auth&&typeof(auth)==='object'&&auth.network){
			old_session[auth.network] = store(auth.network) || {};
		}
	});
	


	(function self(){

		var CURRENT_TIME = ((new Date()).getTime()/1e3);
		var emit = function(event_name){
			hello.emit("auth."+event_name, {
				network: name,
				authResponse: session
			});
		};

		// Loop through the services
		for(var name in hello.services){if(hello.services.hasOwnProperty(name)){

			if(!hello.services[name].id){
				// we haven't attached an ID so dont listen.
				continue;
			}
		
			// Get session
			var session = store(name) || {};
			var provider = hello.services[name];
			var oldsess = old_session[name] || {};

			//
			// Listen for globalEvent's that did not get triggered from the child
			//
			if(session && "callback" in session){

				// to do remove from session object...
				var cb = session.callback;
				try{
					delete session.callback;
				}catch(e){}

				// Update store
				// Removing the callback
				store(name,session);

				// Emit global events
				try{
					window[cb](session);
				}
				catch(e){}
			}
			
			//
			// Refresh token
			//
			if( session && ("expires" in session) && session.expires < CURRENT_TIME ){

				// If auto refresh is provided then determine if we can refresh based upon its value.
				var refresh = !("autorefresh" in provider) || provider.autorefresh;

				// Has the refresh been run recently?
				if( refresh && (!( name in expired ) || expired[name] < CURRENT_TIME ) ){
					// try to resignin
					hello.emit("notice", name + " has expired trying to resignin" );
					hello.login(name,{display:'none', force: false});

					// update expired, every 10 minutes
					expired[name] = CURRENT_TIME + 600;
				}

				// Does this provider not support refresh
				else if( !refresh && !( name in expired ) ) {
					// Label the event
					emit('expired');
					expired[name] = true;
				}

				// If session has expired then we dont want to store its value until it can be established that its been updated
				continue;
			}
			// Has session changed?
			else if( oldsess.access_token === session.access_token &&
						oldsess.expires === session.expires ){
				continue;
			}
			// Access_token has been removed
			else if( !session.access_token && oldsess.access_token ){
				emit('logout');
			}
			// Access_token has been created
			else if( session.access_token && !oldsess.access_token ){
				emit('login');
			}
			// Access_token has been updated
			else if( session.expires !== oldsess.expires ){
				emit('update');
			}

			// Updated stored session
			old_session[name] = session;

			// Remove the expired flags
			if(name in expired){
				delete expired[name];
			}
		}}

		// Check error events
		setTimeout(self, 1000);
	})();

})(hello);








/////////////////////////////////////
//
// Save any access token that is in the current page URL
//
/////////////////////////////////////

(function(hello, window){

	var location = window.location;

	var debug = function(msg,e){
		append("p", {text:msg}, document.documentElement);
		if(e){
			console.log(e);
		}
	};

	//
	// AuthCallback
	// Trigger a callback to authenticate
	//
	function authCallback(network, obj){

		// Trigger the callback on the parent
		store(obj.network, obj );

		// this is a popup so
		if( !("display" in p) || p.display !== 'page'){

			// trigger window.opener
			var win = (window.opener||window.parent);

			if(win){
				// Call the generic listeners
//				win.hello.emit(network+":auth."+(obj.error?'failed':'login'), obj);
				// Call the inline listeners

				// to do remove from session object...
				var cb = obj.callback;
				try{
					delete obj.callback;
				}catch(e){}

				// Update store
				store(obj.network,obj);

				// Call the globalEvent function on the parent
				if(cb in win){
					try{
						win[cb](obj);
					}
					catch(e){
						debug("Error thrown whilst executing parent callback", e);
						return;
					}
				}
				else{
					debug("Error: Callback missing from parent window, snap!");
					return;
				}

			}

			// Close this current window
			try{
				window.close();
			}
			catch(e){}

			// IOS bug wont let us clos it if still loading
			window.addEventListener('load', function(){
				window.close();
			});

			debug("Trying to close window");

			// Dont execute any more
			return;
		}
	}

	//
	// Save session, from redirected authentication
	// #access_token has come in?
	//
	// FACEBOOK is returning auth errors within as a query_string... thats a stickler for consistency.
	// SoundCloud is the state in the querystring and the token in the hashtag, so we'll mix the two together
	
	var p = merge(param(location.search||''), param(location.hash||''));

	
	// if p.state
	if( p && "state" in p ){

		// remove any addition information
		// e.g. p.state = 'facebook.page';
		try{
			var a = JSON.parse(p.state);
			p = merge(p, a);
		}catch(e){
			debug("Could not decode state parameter");
		}

		// access_token?
		if( ("access_token" in p&&p.access_token) && p.network ){

			if(!p.expires_in || parseInt(p.expires_in,10) === 0){
				// If p.expires_in is unset, set to 0
				p.expires_in = 0;
			}
			p.expires_in = parseInt(p.expires_in,10);
			p.expires = ((new Date()).getTime()/1e3) + (p.expires_in || ( 60 * 60 * 24 * 365 ));

			// Make this the default users service
			hello.service( p.network );

			// Lets use the "state" to assign it to one of our networks
			authCallback( p.network, p );
		}

		//error=?
		//&error_description=?
		//&state=?
		else if( ("error" in p && p.error) && p.network ){
			// Error object
			p.error = {
				code: p.error,
				message : p.error_message || p.error_description
			};

			// Let the state handler handle it.
			authCallback( p.network, p );
		}

		// API Calls
		// IFRAME HACK
		// Result is serialized JSON string.
		if(p&&p.callback&&"result" in p && p.result ){
			// trigger a function in the parent
			if(p.callback in window.parent){
				window.parent[p.callback](JSON.parse(p.result));
			}
		}
	}
	//
	// OAuth redirect, fixes URI fragments from being lost in Safari
	// (URI Fragments within 302 Location URI are lost over HTTPS)
	// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
	else if("oauth_redirect" in p){
		window.location = decodeURIComponent(p.oauth_redirect);
		return;
	}

	// redefine
	p = param(location.search);

	// IS THIS AN OAUTH2 SERVER RESPONSE? OR AN OAUTH1 SERVER RESPONSE?
	if((p.code&&p.state) || (p.oauth_token&&p.proxy_url)){
		// Add this path as the redirect_uri
		p.redirect_uri = location.href.replace(/[\?\#].*$/,'');
		// JSON decode
		var state = JSON.parse(p.state);
		// redirect to the host
		var path = (state.oauth_proxy || p.proxy_url) + "?" + param(p);

		window.location = path;
	}

})(hello, window);



// EOF CORE lib
//////////////////////////////////







/////////////////////////////////////////
// API
// @param path		string
// @param method	string (optional)
// @param data		object (optional)
// @param timeout	integer (optional)
// @param callback	function (optional)

hello.api = function(){

	// get arguments
	var p = args({path:'s!', method : "s", data:'o', timeout:'i', callback:"f" }, arguments);

	// Create self
	// An object which inherits its parent as the prototype.
	// And constructs a new event chain.
	var self = this.use();

	//
	// EXTRA: Convert FORMElements to JSON for POSTING
	// Wrappers to add additional functionality to existing functions
	//
	// Change for into a data object
	dataToJSON(p);


	// Reference arguments
	self.args = p;

	// method
	p.method = (p.method || 'get').toLowerCase();
	
	// data
	var data = p.data = p.data || {};

	// Completed event
	// callback
	self.on('complete', p.callback);
	

	// Path
	// Remove the network from path, e.g. facebook:/me/friends
	// results in { network : facebook, path : me/friends }
	p.path = p.path.replace(/^\/+/,'');
	var a = (p.path.split(/[\/\:]/,2)||[])[0].toLowerCase();

	if(a in self.services){
		p.network = a;
		var reg = new RegExp('^'+a+':?\/?');
		p.path = p.path.replace(reg,'');
	}


	// Network & Provider
	// Define the network that this request is made for
	p.network = self.settings.default_service = p.network || self.settings.default_service;
	var o = self.services[p.network];

	// INVALID?
	// Is there no service by the given network name?
	if(!o){
		self.emitAfter("complete error", {error:{
			code : "invalid_network",
			message : "Could not match the service requested: " + p.network
		}});
		return self;
	}


	// timeout global setting
	if(p.timeout){
		self.settings.timeout = p.timeout;
	}

	// Log self request
	self.emit("notice", "API request "+p.method.toUpperCase()+" '"+p.path+"' (request)",p);
	

	//
	// CALLBACK HANDLER
	// Change the incoming values so that they are have generic values according to the path that is defined
	// @ response object
	// @ statusCode integer if available
	var callback = function(r,headers){

		// FORMAT RESPONSE?
		// Does self request have a corresponding formatter
		if( o.wrap && ( (p.path in o.wrap) || ("default" in o.wrap) )){
			var wrap = (p.path in o.wrap ? p.path : "default");
			var time = (new Date()).getTime();

			// FORMAT RESPONSE
			var b = o.wrap[wrap](r,headers,p);

			// Has the response been utterly overwritten?
			// Typically self augments the existing object.. but for those rare occassions
			if(b){
				r = b;
			}

			// Emit a notice
			self.emit("notice", "Processing took" + ((new Date()).getTime() - time));
		}

		self.emit("notice", "API: "+p.method.toUpperCase()+" '"+p.path+"' (response)", r);

		//
		// Next
		// If the result continues on to other pages
		// callback = function(results, next){ if(next){ next(); } }
		var next = null;

		// Is there a next_page defined in the response?
		if( r && "paging" in r && r.paging.next ){
			// Repeat the action with a new page path
			// This benefits from otherwise letting the user follow the next_page URL
			// In terms of using the same callback handlers etc.
			next = function(){
				processPath( (r.paging.next.match(/^\?/)?p.path:'') + r.paging.next );
			};
		}

		//
		// Dispatch to listeners
		// Emit events which pertain to the formatted response
		self.emit("complete " + (!r || "error" in r ? 'error' : 'success'), r, next);
	};



	// push out to all networks
	// as long as the path isn't flagged as unavaiable, e.g. path == false
	if( !( !(p.method in o) || !(p.path in o[p.method]) || o[p.method][p.path] !== false ) ){
		return self.emitAfter("complete error", {error:{
			code:'invalid_path',
			message:'The provided path is not available on the selected network'
		}});
	}

	//
	// Get the current session
	var session = self.getAuthResponse(p.network);


	//
	// Given the path trigger the fix
	processPath(p.path);


	function processPath(path){

		// Clone the data object
		// Prevent this script overwriting the data of the incoming object.
		// ensure that everytime we run an iteration the callbacks haven't removed some data
		p.data = clone(data);


		// Extrapolate the QueryString
		// Provide a clean path
		// Move the querystring into the data
		if(p.method==='get'){
			var reg = /[\?\&]([^=&]+)(=([^&]+))?/ig,
				m;
			while((m = reg.exec(path))){
				p.data[m[1]] = m[3];
			}
			path = path.replace(/\?.*/,'');
		}


		// URL Mapping
		// Is there a map for the given URL?
		var actions = o[{"delete":"del"}[p.method]||p.method] || {},
			url = actions[path] || actions['default'] || path;


		// if url needs a base
		// Wrap everything in
		var getPath = function(url){

			// Format the string if it needs it
			url = url.replace(/\@\{([a-z\_\-]+)(\|.+?)?\}/gi, function(m,key,defaults){
				var val = defaults ? defaults.replace(/^\|/,'') : '';
				if(key in p.data){
					val = p.data[key];
					delete p.data[key];
				}
				else if(typeof(defaults) === 'undefined'){
					self.emitAfter("error", {error:{
						code : "missing_attribute_"+key,
						message : "The attribute " + key + " is missing from the request"
					}});
				}
				return val;
			});

			// Add base
			if( !url.match(/^https?:\/\//) ){
				url = o.base + url;
			}


			var _qs = {};

			// Format URL
			var format_url = function( qs_handler, callback ){

				// Execute the qs_handler for any additional parameters
				if(qs_handler){
					if(typeof(qs_handler)==='function'){
						qs_handler(_qs);
					}
					else{
						_qs = merge(_qs, qs_handler);
					}
				}

				var path = qs(url, _qs||{} );

				self.emit("notice", "Request " + path);

				_sign(p.network, path, p.method, p.data, o.querystring, callback);
			};


			// Update the resource_uri
			//url += ( url.indexOf('?') > -1 ? "&" : "?" );

			// Format the data
			if( !isEmpty(p.data) && !("FileList" in window) && hasBinary(p.data) ){
				// If we can't format the post then, we are going to run the iFrame hack
				post( format_url, p.data, ("form" in o ? o.form(p) : null), callback );

				return self;
			}

			// the delete callback needs a better response
			if(p.method === 'delete'){
				var _callback = callback;
				callback = function(r, code){
					_callback((!r||isEmpty(r))? {success:true} : r, code);
				};
			}

			// Can we use XHR for Cross domain delivery?
			if( 'withCredentials' in new XMLHttpRequest() && ( !("xhr" in o) || ( o.xhr && o.xhr(p,_qs) ) ) ){
				var x = xhr( p.method, format_url, p.headers, p.data, callback );
				x.onprogress = function(e){
					self.emit("progress", e);
				};
				x.upload.onprogress = function(e){
					self.emit("uploadprogress", e);
				};
			}
			else{

				// Assign a new callbackID
				p.callbackID = globalEvent();

				// Otherwise we're on to the old school, IFRAME hacks and JSONP
				// Preprocess the parameters
				// Change the p parameters
				if("jsonp" in o){
					o.jsonp(p,_qs);
				}

				// Does this provider have a custom method?
				if("api" in o && o.api( url, p, {access_token:session.access_token}, callback ) ){
					return;
				}

				// Is method still a post?
				if( p.method === 'post' ){

					// Add some additional query parameters to the URL
					// We're pretty stuffed if the endpoint doesn't like these
					//			"suppress_response_codes":true
					_qs.redirect_uri = self.settings.redirect_uri;
					_qs.state = JSON.stringify({callback:p.callbackID});

					post( format_url, p.data, ("form" in o ? o.form(p) : null), callback, p.callbackID, self.settings.timeout );
				}

				// Make the call
				else{

					_qs = merge(_qs,p.data);
					_qs.callback = p.callbackID;

					jsonp( format_url, callback, p.callbackID, self.settings.timeout );
				}
			}
		};

		// Make request
		if(typeof(url)==='function'){
			// Does self have its own callback?
			url(p, getPath);
		}
		else{
			// Else the URL is a string
			getPath(url);
		}
	}
	

	return self;


	//
	// Add authentication to the URL
	function _sign(network, path, method, data, modifyQueryString, callback){

		// OAUTH SIGNING PROXY
		var service = self.services[network],
			token = (session ? session.access_token : null);

		// Is self an OAuth1 endpoint
		var proxy = ( service.oauth && parseInt(service.oauth.version,10) === 1 ? self.settings.oauth_proxy : null);

		if(proxy){
			// Use the proxy as a path
			callback( qs(proxy, {
				path : path,
				access_token : token||'',
				then : (method.toLowerCase() === 'get' ? 'redirect' : 'proxy'),
				method : method,
				suppress_response_codes : true
			}));
			return;
		}

		var _qs = { 'access_token' : token||'' };

		if(modifyQueryString){
			modifyQueryString(_qs);
		}

		callback(  qs( path, _qs) );
	}

};

window.hello = hello;

return hello;

});