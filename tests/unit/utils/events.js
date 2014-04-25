define([
	'../../src/utils/events'
], function(
	Event
){



//
// Events
//
describe('Events', function(){

	var hello = new Event();

	// Pass an arbitary piece of data around
	var arbitary_data = {boom:true},
		event_name = 'custom';

	var test_response = function(done){
		return function(data, type){
			expect( event_name ).to.be( type );
			expect( arbitary_data ).to.be( data);
			done();
		};
	};

	it('should trigger event on constructor', function(done){

		// Make request
		var func = test_response(done);
		hello.on(event_name, func);
		hello.emit(event_name, arbitary_data);

	});
	it('should remove event from constructor', function(done){

		var spy = sinon.spy(function(){
			console.log("Whooo");
		});

		hello.on("notfired", spy );
		hello.off("notfired", spy );
		hello.emit("notfired", arbitary_data);
		setTimeout(function(){
			expect( !spy.called ).to.be.ok();
			done();
		},10);

	});
	it('should trigger event on instance', function(done){

		// Make request
		var boom = hello("boom");
		boom.on(event_name, test_response(done));
		boom.emit(event_name, arbitary_data);

	});
});

	
});