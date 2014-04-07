'use strict';

describe('Index.js', function() {
	var F;
	process.argv.push('--help');
	F = require('../lib/index');
	var o = new F({
		a : 'pass',
		usage : 'sdf'
	});
	it('test1', function() {
		expect(true).toBe(true);
	});
});
