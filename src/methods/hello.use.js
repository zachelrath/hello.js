//
// Use
// Define a new instance of the Hello library with a default service
//

define([
	'utils/events'
], function(Events){

	return function(service){

		// Create self, which inherits from its parent
		var self = objectCreate(this);

		// Inherit the prototype from its parent
		self.settings = objectCreate(this.settings);

		// Define the default service
		if(service){
			self.settings.default_service = service;
		}

		// Create an instance of Events
		Event.call(self);

		return self;
	};

});