//
// isArray
// 
define(function(){
	return function (o){
		return Object.prototype.toString.call(o) === '[object Array]';
	};
});