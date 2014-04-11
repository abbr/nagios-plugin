'use strict';
Object.defineProperty(Array.prototype, 'indexOfObject', {
	enumerable : false,
	value : function(property, value) {
		for ( var i = 0, len = this.length; i < len; i++) {
			if (this[i][property] === value) {
				return i;
			}
		}
		return -1;
	}
});

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
		expect(o.checkMessages).toBeDefined();
		expect(o.addPerfData).toBeDefined();
		expect(o.getRetureMessage).toBeDefined();
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
		it('calls method setThresholds() twice', function() {
			o.setThresholds({
				'critical' : 60,
				'warning' : 15
			});
			o.setThresholds({
				'warning' : 16
			});
			expect(o.threshold.critical).toBe(60);
			expect(o.threshold.warning).toBe(16);
		});
	});

	it('calls method checkThreshold()', function() {
		o.setThresholds({
			'critical' : 60,
			'warning' : 15
		});
		var state = o.checkThreshold(61);
		expect(state).toBe(o.states.CRITICAL);
	});
	it('calls methods addMessage() then checkMessages()', function() {
		o.addMessage(o.states.CRITICAL, 'sky falling');
		var messageObj = o.checkMessages();
		expect(messageObj.message).toContain('sky falling');
	});
	describe('calls methods setThresholds() then addPerfdata()', function() {
		o.setThresholds({
			'critical' : 60,
			'warning' : 15
		});
		o.addPerfData({
			label : 'time',
			value : 15,
			uom : 's',
			threshold : o.threshold
		});
		it('', function() {
			expect(o.perfData[o.perfData.indexOfObject('label', 'time')].uom).toBe(
					's');
		});
		it('then getRetureMessage()', function() {
			var msg = o.getRetureMessage(2, 'failure');
			expect(msg).toContain('CRITICAL - failure|time=15s;15;60');
		});
	});
});
