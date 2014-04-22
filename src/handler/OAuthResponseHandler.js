//
// OAuthResponseHandler
// Handles a responses from OAuth flows
// Saving credentials which are shared from the window.location object
//
define([
	'../utils/merge',
	'../utils/store',
	'../utils/param'
],function(
	merge,
	store,
	param
){

	//
	// AuthCallback
	// Trigger a callback to authenticate
	//
	function authCallback(obj, window, parent){

		// Trigger the callback on the parent
		store(obj.network, obj );

		// if this is a page request
		// therefore it has no parent or opener window to handle callbacks
		if( ("display" in obj) && obj.display === 'page' ){
			return;
		}

		if(parent){
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
			if(cb in parent){
				try{
					parent[cb](obj);
				}
				catch(e){
					console.error("Error thrown whilst executing parent callback, "+cb, e);
					return;
				}
			}
			else{
				console.error("Error: Callback missing from parent window, snap!");
				return;
			}

		}

		// Close this current window
		try{
			window.close();
		}
		catch(e){}

		// IOS bug wont let us close a popup if still loading
		window.addEventListener('load', function(){
			window.close();
		});
		console.log("Trying to close window");
	}


	//
	// Process the path
	// This looks at the page variables and decides how to proceed
	// Initially this is triggered at runtime, when hello.js is called from the redirect_uri page.
	return function( window, parent ){

		//
		var location = window.location;

		//
		// Add a helper for relocating, instead of window.location  = url;
		//
		var relocate = function(path){
			if(location.assign){
				location.assign(path);
			}
			else{
				window.location = path;
			}
		};

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
				console.error("Could not decode state parameter");
			}

			// access_token?
			if( ("access_token" in p&&p.access_token) && p.network ){

				if(!p.expires_in || parseInt(p.expires_in,10) === 0){
					// If p.expires_in is unset, set to 0
					p.expires_in = 0;
				}
				p.expires_in = parseInt(p.expires_in,10);
				p.expires = ((new Date()).getTime()/1e3) + (p.expires_in || ( 60 * 60 * 24 * 365 ));

				// Lets use the "state" to assign it to one of our networks
				authCallback( p, window, parent );
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
				authCallback( p, window, parent );
			}

			// API Calls
			// IFRAME HACK
			// Result is serialized JSON string.
			if(p&&p.callback&&"result" in p && p.result ){
				// trigger a function in the parent
				if(p.callback in parent){
					parent[p.callback](JSON.parse(p.result));
				}
			}
		}
		//
		// OAuth redirect, fixes URI fragments from being lost in Safari
		// (URI Fragments within 302 Location URI are lost over HTTPS)
		// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
		else if("oauth_redirect" in p){

			relocate( decodeURIComponent(p.oauth_redirect) );
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

			relocate( path );
		}

	};

});