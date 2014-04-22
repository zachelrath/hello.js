//
// unique
// remove duplicate and null values from an array
// @param a array
//
define(['./indexOf'],function(indexOf){
	return function(a){
		if(typeof(a)!=='object'){ return []; }
		var r = [];
		for(var i=0;i<a.length;i++){

			if(!a[i]||a[i].length===0||indexOf(r, a[i])!==-1){
				continue;
			}
			else{
				r.push(a[i]);
			}
		}
		return r;
	};
});