//
// parseURL
// Break a URL into its constituent parts
//
define(function(){
	return function(url){
		var a = document.createElement('a');
		a.href = url;
		return a;
	};
});