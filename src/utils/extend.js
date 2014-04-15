//
// Extend the first object with the properties and methods of the second
//
define(function(){
	return function(a,b){
		for(var x in b){
			a[x] = b[x];
		}
	};
});