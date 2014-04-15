//
// dataToJSON
// This takes a FormElement|NodeList|InputElement|MixedObjects and convers the data object to JSON.
//
define([

	'utils/domInstance',
	'utils/nodeListToJSON'

],function(domInstance, nodeListToJSON){

	return function(p){

		var data = p.data;

		// Is data a form object
		if( domInstance('form', data) ){

			data = nodeListToJSON(data.elements);

		}
		else if ( "NodeList" in window && data instanceof NodeList ){

			data = nodeListToJSON(data);

		}
		else if( domInstance('input', data) ){

			data = nodeListToJSON( [ data ] );

		}

		// Is data a blob, File, FileList?
		if( ("File" in window && data instanceof window.File) ||
			("Blob" in window && data instanceof window.Blob) ||
			("FileList" in window && data instanceof window.FileList) ){

			// Convert to a JSON object
			data = {'file' : data};
		}

		// Loop through data if its not FormData it must now be a JSON object
		if( !( "FormData" in window && data instanceof window.FormData ) ){

			// Loop through the object
			for(var x in data) if(data.hasOwnProperty(x)){

				// FileList Object?
				if("FileList" in window && data[x] instanceof window.FileList){
					// Get first record only
					if(data[x].length===1){
						data[x] = data[x][0];
					}
					else{
						//("We were expecting the FileList to contain one file");
					}
				}
				else if( domInstance('input', data[x]) && data[x].type === 'file' ){
					// ignore
					continue;
				}
				else if( domInstance('input', data[x]) ||
					domInstance('select', data[x]) ||
					domInstance('textArea', data[x])
					){
					data[x] = data[x].value;
				}
				// Else is this another kind of element?
				else if( domInstance(null, data[x]) ){
					data[x] = data[x].innerHTML || data[x].innerText;
				}
			}
		}

		// Data has been converted to JSON.
		p.data = data;
		return data;
	};
});