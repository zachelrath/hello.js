//
// realPath
// Converts relative URL's to fully qualified URL's
define(function(){

	var location = window.location;
	var regAsc = /\/[^\/]+\/\.\.\//g;

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

		while( regAsc.test(path) ){
			regAsc.lastIndex = 0;
			path = path.replace(regAsc, '/');
		}
		return path;
	};
});