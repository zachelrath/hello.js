//
// Local Storage Facade
define(function(){

	//
	// LocalStorage
	var a = [window.localStorage,window.sessionStorage],
		i=0;

	// Set LocalStorage
	var localStorage = a[i++];

	while(localStorage){
		try{
			localStorage.setItem(i,i);
			localStorage.removeItem(i);
			break;
		}
		catch(e){
			localStorage = a[i++];
		}
	}

	if(!localStorage){
		localStorage = {
			getItem : function(prop){
				prop = prop +'=';
				var m = document.cookie.split(";");
				for(var i=0;i<m.length;i++){
					var _m = m[i].replace(/(^\s+|\s+$)/,'');
					if(_m && _m.indexOf(prop)===0){
						return _m.substr(prop.length);
					}
				}
				return null;
			},
			setItem : function(prop, value){
				document.cookie = prop + '=' + value;
			}
		};
	}

	// Does this browser support localStorage?

	return function (name,value,days) {

		// Local storage
		var json = JSON.parse(localStorage.getItem('hello')) || {};

		if( name && value === undefined ){
			return json[name] || null;
		}
		else if(name && value === null){
			try{
				delete json[name];
			}
			catch(e){
				json[name] = null;
			}
		}
		else if(name){
			json[name] = value;
		}
		else {
			return json;
		}

		localStorage.setItem('hello', JSON.stringify(json));

		return json || null;
	};

});
