//
//
// diff
define(['./indexOf'],function(indexOf){
	return function(a,b){
		var r = [];
		for(var i=0;i<b.length;i++){
			if(indexOf(a,b[i])===-1){
				r.push(b[i]);
			}
		}
		return r;
	};
});