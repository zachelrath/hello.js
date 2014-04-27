//
// Event
// A contructor superclass for adding event menthods, on, off, emit.
//
define([
	'./indexOf'
],function(
	indexOf
){

	return function(){
		// If this doesn't support getProtoType then we can't get prototype.events of the parent
		// So lets get the current instance events, and add those to a parent property
		this.parent = {
			events : this.events,
			findEvents : this.findEvents,
			parent : this.parent
		};

		this.events = {};

		//
		// On, Subscribe to events
		// @param evt		string
		// @param callback	function
		//
		this.on = function(evt, callback){

			if(callback&&typeof(callback)==='function'){
				var a = evt.split(/[\s\,]+/);
				for(var i=0;i<a.length;i++){

					// Has this event already been fired on this instance?
					this.events[a[i]] = [callback].concat(this.events[a[i]]||[]);
				}
			}

			return this;
		};


		//
		// Off, Unsubscribe to events
		// @param evt		string
		// @param callback	function
		//
		this.off = function(evt, callback){

			this.findEvents(evt, function(name, index){
				if(!callback || this.events[name][index] === callback){
					this.events[name].splice(index,1);
				}
			});

			return this;
		};

		//
		// Emit
		// Triggers any subscribed events
		//
		this.emit = function(evt, data){

			// Get arguments as an Array, knock off the first one
			var args = Array.prototype.slice.call(arguments, 1);
			args.push(evt);

			// Handler
			var handler = function(name, index){
				// Replace the last property with the event name
				args[args.length-1] = name;

				// Trigger
				this.events[name][index].apply(this, args);
			};

			// Find the callbacks which match the condition and call
			var proto = this;
			while( proto && proto.findEvents ){
				proto.findEvents(evt, handler);

				// proto = getPrototypeOf(proto);
				proto = proto.parent;
			}

			return this;
		};

		//
		// Easy functions
		this.emitAfter = function(){
			var self = this,
				args = arguments;
			setTimeout(function(){
				self.emit.apply(self, args);
			},0);
			return this;
		};
		this.success = function(callback){
			return this.on("success",callback);
		};
		this.error = function(callback){
			return this.on("error",callback);
		};
		this.complete = function(callback){
			return this.on("complete",callback);
		};


		this.findEvents = function(evt, callback){

			var a = evt.split(/[\s\,]+/);

			for(var name in this.events){if(this.events.hasOwnProperty(name)){
				if( indexOf(a,name) > -1 ){
					for(var i=0;i<this.events[name].length;i++){
						// Emit on the local instance of this
						callback.call(this, name, i);
					}
				}
			}}
		};
	};
});