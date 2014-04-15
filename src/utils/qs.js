//
// Querystring
//
define([
	'utils/param',
	'utils/isEmpty'
], function( param, isEmpty ){
	
	// Append the querystring to a url
	// @param string url
	// @param object parameters
	return function(url, params){
		if(params){
			var reg;
			for(var x in params){
				if(url.indexOf(x)>-1){
					var str = "[\\?\\&]"+x+"=[^\\&]*";
					reg = new RegExp(str);
					url = url.replace(reg,'');
				}
			}
		}
		return url + (!isEmpty(params) ? ( url.indexOf('?') > -1 ? "&" : "?" ) + param(params) : '');
	};

});