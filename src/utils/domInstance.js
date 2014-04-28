//
// _DOM
// return the type of DOM object
//
define(function(){

	return function(type,data){

		var test = "HTML" + (type||'').replace(/^[a-z]/,function(m){return m.toUpperCase();}) + "Element";

		if(!data){
			throw "domInstance: No Data";
		}
		else if(window[test]){
			return data instanceof window[test];
		}
		else if(window.Element){
			return data instanceof window.Element && (!type || (data.tagName&&data.tagName.toLowerCase() === type));
		}
		else{
			return (!(data instanceof Object||data instanceof Array||data instanceof String||data instanceof Number) && data.tagName && data.tagName.toLowerCase() === type );
		}

	};

});