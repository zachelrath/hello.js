//
// Clone
// Create a clone of an object
//
define(function(){

	return function clone(obj){
		// can't clone DOM nodes
		if("nodeName" in obj){
			return obj;
		}
		var _clone = {}, x;
		for(x in obj){
			if(typeof(obj[x]) === 'object'){
				_clone[x] = clone(obj[x]);
			}
			else{
				_clone[x] = obj[x];
			}
		}
		return _clone;
	};

});