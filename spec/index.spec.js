'use strict';

describe('index', function() {
	describe('Your first index', function() {
		var F;
		process.argv.push('--help');
		F = require('../lib/index');
		var o = new F({
			a : 'pass',
			usage : 'sdf'
		});
		it('test1', function() {
			expect(o.prop1).toEqual('prop1');
		});
	});
});
