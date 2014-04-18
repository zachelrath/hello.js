//
// parseURL
// turn a URL into its consituent parts
//
define(function(){
	return function(url){
		var a = document.createElement('a');
		a.href = url;
		return;
	};
});