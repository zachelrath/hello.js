//
// Hello Redirect Handler
//
define(['./handler/OAuthResponseHandler'], function(OAuthResponseHandler){
	OAuthResponseHandler( window, window.opener || window.parent );
});