//
// realPath
// Converts relative URL's to fully qualified URL's
define(function(){

	var location = window.location;

	return function(path){

		if(!path){
			return location.href;
		}
		else if( path.indexOf('/') === 0 ){
			path = location.protocol + ( path.indexOf('//') === 0 ? path : '//' + location.host + path );
		}
		// Is the redirect_uri relative?
		else if( !path.match(/^https?\:\/\//) ){
			path = (location.href.replace(/#.*/,'').replace(/\/[^\/]+$/,'/') + path).replace(/\/\.\//g,'/');
		}

		// Unoptimised
		// When a regExp variable was used IE8 would fail as it did not recognise regexp.lastindex, 
		// ... and be able to reset the position of the regexp
		while( /\/[^\/]+\/\.\.\//g.test(path) ){
			path = path.replace(/\/[^\/]+\/\.\.\//g, '/');
		}
		return path;
	};
});