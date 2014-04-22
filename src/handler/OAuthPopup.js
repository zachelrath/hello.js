//
// OAuthPopup
//

define([
	'../utils/parseURL',
	'./OAuthResponseHandler'
], function(
	parseURL,
	OAuthResponseHandler
){

	// Help the minifier
	var documentElement = document.documentElement;
	var screen = window.screen;

	return function(url, redirect_uri, windowWidth, windowHeight){

		// Multi Screen Popup Positioning (http://stackoverflow.com/a/16861050)
		//   Credit: http://www.xtf.dk/2011/08/center-new-popup-window-even-on.html
		// Fixes dual-screen position                         Most browsers      Firefox
		var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
		var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

		var width = window.innerWidth || documentElement.clientWidth || screen.width;
		var height = window.innerHeight || documentElement.clientHeight || screen.height;

		var left = ((width - windowWidth) / 2) + dualScreenLeft;
		var top  = ((height - windowHeight) / 2) + dualScreenTop;

		// Create a function for reopening the popup, and assigning events to the new popup object
		// This is a fix whereby triggering the
		var open = function (url){

			// Trigger callback
			var popup = window.open(
				url,
				'_blank',
				"resizeable=true,height=" + windowHeight + ",width=" + windowWidth + ",left=" + left + ",top="  + top
			);

			// PhoneGap support
			// Add an event listener to listen to the change in the popup windows URL
			// This must appear before popup.focus();
			popup.addEventListener('loadstart', function(e){

				var url = e.url;

				// Is this the path, as given by the redirect_uri?
				if(url.indexOf(redirect_uri)===0){

					// We dont have window operations on the popup so lets create some
					// The location can be augmented in to a location object like so...

					var a = parseURL(url);

					var _popup = {
						location : {
							// Change the location of the popup
							assign : function(location){
								
								// Unfouurtunatly an app is unable to change the location of a WebView window.
								// Soweopen a new one
								popup.addEventListener('exit', function(){
									//
									// For some reason its failing to close the window if we open a new one two soon
									// 
									setTimeout(function(){
										open(location);
									},1000);
								});

								// kill the previous popup
								_popup.close();
							},
							search : a.search,
							hash : a.hash,
							href : url
						},
						close : function(){
							//alert('closing location:'+url);
							if(popup.close){
								popup.close();
							}
						}
					};

					// Then this URL contains information which HelloJS must process
					// URL string
					// Window - any action such as window relocation goes here
					// Opener - the parent window which opened this, aka this script
					OAuthResponseHandler( _popup, window );
				}
			});

			return popup;
		};


		//
		// Call the open() function with the initial path
		//
		// OAuth redirect, fixes URI fragments from being lost in Safari
		// (URI Fragments within 302 Location URI are lost over HTTPS)
		// Loading the redirect.html before triggering the OAuth Flow seems to fix it.
		// 
		// FIREFOX, decodes URL fragments when calling location.hash. 
		//  - This is bad if the value contains break points which are escaped
		//  - Hence the url must be encoded twice as it contains breakpoints.
		if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
			url = redirect_uri + "#oauth_redirect=" + encodeURIComponent(encodeURIComponent(url));
		}

		return open( url );
	};
});