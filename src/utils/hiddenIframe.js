//
// Hidden iFrame
//
define(['./append'],function(append){

	return function(url){
		return append('iframe', {
			src : url,
			style : {position:'absolute',left:"-1000px",bottom:0,height:'1px',width:'1px'}
		}, 'body');
	};
});