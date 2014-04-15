
//
// Some of the providers require that only MultiPart is used with non-binary forms.
// This function checks whether the form contains binary data

define([
	'utils/domInstance'
],function(domInstance){

	return function (data){
		var w = window;
		for(var x in data ) if(data.hasOwnProperty(x)){
			if( (domInstance('input', data[x]) && data[x].type === 'file')	||
				("FileList" in w && data[x] instanceof w.FileList) ||
				("File" in w && data[x] instanceof w.File) ||
				("Blob" in w && data[x] instanceof w.Blob)
			){
				return true;
			}
		}
		return false;
	};

});