
//
// Some of the providers require that only MultiPart is used with non-binary forms.
// This function checks whether the form contains binary data

define(function(){

	return function (data){
		return (
			("FileList" in window && data instanceof window.FileList) ||
			("File" in window && data instanceof window.File) ||
			("Blob" in window && data instanceof window.Blob)
		);
	};

});