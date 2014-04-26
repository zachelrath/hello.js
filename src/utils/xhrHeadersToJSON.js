


define(function(){
	//
	// headersToJSON
	// Headers are returned as a string, which isn't all that great... is it?
	//
	return function (s){
		var r = {};
		var reg = /([a-z\-]+):\s?(.*);?/gi,
			m;
		while((m = reg.exec(s))){
			r[m[1]] = m[2];
		}
		return r;
	};
});