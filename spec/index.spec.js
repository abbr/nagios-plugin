'use strict';

function hookStdout(callback) {
	var oldWrite = process.stdout.write;
	// jshint unused: false
	process.stdout.write = (function(write) {
		return function(string, encoding, fd) {
			//write.apply(process.stdout, arguments);
			callback(string, encoding, fd);
		};
	})(process.stdout.write);

	return function() {
		process.stdout.write = oldWrite;
	};
}

describe('Index.js', function() {
	var F;
	process.argv.push('--help');
	F = require('../lib/index');
	var o = new F({
		a : 'pass',
		usage : 'sdf'
	});
	var outStr, unhook;
	beforeEach(function() {
		outStr = '';
		unhook = hookStdout(function(string) {
			outStr += string;
		});
	});
	afterEach(function() {
		unhook();
	});
	it('test1', function() {
		o.getOpts();
		expect(outStr).toContain('Print detailed help screen');
	});
});
