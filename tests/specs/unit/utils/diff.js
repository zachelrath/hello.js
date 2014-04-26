define([
	'../../../../src/utils/diff'
], function(
	diff
){

//
// Events
//
describe('utils / diff', function(){


	it('should return the values which are in the second array but not the first', function(){

		var value = diff([1,3],[1,2,3]);
		expect( value ).to.eql( [2] );

		value = diff( [1,2,3], [1,3] );
		expect( value ).to.eql( [] );

	});

});

	
});