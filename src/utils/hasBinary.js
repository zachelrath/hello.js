
//
// Some of the providers require that only MultiPart is used with non-binary forms.
// This function checks whether the form contains binary data

define([
	'./domInstance',
	'./isBinary'
],function(domInstance, isBinary){

	return function (data){

		for(var x in data ) if(data.hasOwnProperty(x)){
			if( (domInstance('input', data[x]) && data[x].type === 'file') ||
				isBinary( data[x] )
			){
				return true;
			}
		}
		return false;
	};

});