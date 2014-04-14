'use strict';
// add a command line options parser; you can substitute with your own favorite
var program = require('commander');
program
	.version('0.0.1')
	.usage('[Options] -- <arguments passed to wget>')
	.option('-m, --match <string>', 'String response body must match')
	.option('-w, --warning <float>', 'Warning threshold')
	.option('-c, --critical <float>', 'Critical threshold')
	.parse(process.argv);
// create a new plugin object with optional initialization parameters
var Plugin = require('./lib/index.js');
var o = new Plugin({
	// shortName is used in output
	shortName : 'wget_http'
});
// set monitor thresholds
o.setThresholds({
	'critical' : program.critical || 2,
	'warning' : program.warning || 0.2
});

// run the check - replace with your own business logic
var exec = require('child_process').exec;
var before = new Date().getTime();
exec('wget -qO- ' + program.args.join(' '), function(error, stdout, stderr) {
	var after = new Date().getTime();
	var diff = (after - before) / 1000;

	// check actual data against predefined threshold
	// and returns state: OK, WARNING or CRITICAL
	var state = o.checkThreshold(diff);
	// Add message for later output. Multiple messages
	// in the same state are concatenated at output
	o.addMessage(state, stdout.length + ' bytes in ' + diff + ' seconds response time.');
	// use get() method to retrieved parsed program arguments
	if (program.match && stdout.indexOf(program.match) === -1) {
		o.addMessage(o.states.CRITICAL, program.match + ' not found');
	}
	// Add performance data
	o.addPerfData({
		label : "time",
		value : diff,
		uom : "s",
		threshold : o.threshold,
		min : 0
	});
	o.addPerfData({
		label : "size",
		value : stdout.length,
		uom : "B",
		min : 0
	});
	// check messages added earlier and return the most severe set:
	// CRITICAL; otherwise WARNING; otherwise OK
	var messageObj = o.checkMessages();
	// output the short name, state, message and perf data
	// exit the program with state as return code
	o.nagiosExit(messageObj.state, messageObj.message);
});
