//
// merge
// recursive merge two objects into one, second parameter overides the first
// @param a array
//
define(['./extend'],function(extend){

	return function(/*a,b*/){
		var args = Array.prototype.slice.call(arguments);
		args.unshift({});
		return extend.apply(null, args);
	};
});
