'use strict';

function hookStdout(callback) {
	var oldWrite = process.stdout.write;
	// jshint unused: false
	process.stdout.write = (function(write) {
		return function(string, encoding, fd) {
			// write.apply(process.stdout, arguments);
			callback(string, encoding, fd);
		};
	})(process.stdout.write);

	return function() {
		process.stdout.write = oldWrite;
	};
}

describe('lib/index.js,', function() {
	var F;
	F = require('../lib/index');
	var o = new F({
		a : 'pass',
		usage : 'Usage: ...'
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

	it('should define functions', function() {
		expect(o.addArg).toBeDefined();
		expect(o.getOpts).toBeDefined();
		expect(o.setThresholds).toBeDefined();
		expect(o.checkThreshold).toBeDefined();
		expect(o.addMessage).toBeDefined();
		expect(o.addPerfdata).toBeDefined();
		expect(o.nagiosExit).toBeDefined();
	});
	describe('invoked with argument --usage,', function() {
		var oldArgv;
		beforeEach(function() {
			oldArgv = process.argv;
			process.argv = [ 'node', __filename, '--usage' ];
		});
		afterEach(function() {
			process.argv = oldArgv;
		});
		it('calls method getOpts()', function() {
			o.getOpts();
			expect(outStr).toContain('Usage:');
		});
	});

	describe('invoked with argument --help,', function() {
		var oldArgv;
		beforeEach(function() {
			oldArgv = process.argv;
			process.argv = [ 'node', __filename, '--help' ];
		});
		afterEach(function() {
			process.argv = oldArgv;
		});
		it('calls method getOpts()', function() {
			o.getOpts();
			expect(outStr).toContain('Print detailed help screen');
		});
		it('calls method addArg() then getOpts()', function() {
			o.addArg({
				'spec' : 'm|myArg',
				'help' : 'my argument'
			});
			o.getOpts();
			expect(outStr).toContain('my argument');
		});
	});

	describe('invoked with no arguments,', function() {
		it('calls method setThresholds()', function() {
			o.setThresholds({
				'critical' : 60,
				'warning' : 15
			});
			expect(o.threshold.critical).toBe(60);
		});
	});

});
