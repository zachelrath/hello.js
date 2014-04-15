//
// Shim, Object create
// A shim for Object.create(), it adds a prototype to a new object
define(function(){

	if (Object.create) {
		return Object.create;
	}

	function F(){}

	return function(o){
		if (arguments.length != 1) {
			throw new Error('Object.create implementation only accepts one parameter.');
		}
		F.prototype = o;
		return new F();
	};
});