//
// AMD shim to expose the HelloJS library
//
if (typeof define === 'function' && define.amd) {
	// AMD. Register as an anonymous module.
	define(function(){
		return hello;
	});
}