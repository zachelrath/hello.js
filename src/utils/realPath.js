//
// realPath
// Converts relative URL's to fully qualified URL's
define(function(){

	return function(path){

		var location = window.location;

		if( path.indexOf('/') === 0 ){
			path = location.protocol + '//' + location.host + path;
		}
		// Is the redirect_uri relative?
		else if( !path.match(/^https?\:\/\//) ){
			path = (location.href.replace(/#.*/,'').replace(/\/[^\/]+$/,'/') + path).replace(/\/\.\//g,'/');
		}
		while( /\/[^\/]+\/\.\.\//g.test(path) ){
			path = path.replace(/\/[^\/]+\/\.\.\//g, '/');
		}
		return path;
	};
});