'use strict';
// add a command line parser;
// you can substitute with your own favorite npm module
var getOpt = require('node-getopt')
.create([ [ 'm', 'match=<STRING>', 'String response body must match' ]
        , [ 'w', 'warning=<STRING>', 'Warning threshold' ]
        , [ 'c', 'critical=<STRING>', 'Critical threshold' ]
        , [ 'h', 'help', 'display this help' ] ])
.bindHelp();
getOpt.setHelp('Usage: node test.js [Options] -- '
		+ '<arguments passed to wget>\nOptions:\n[[OPTIONS]]');
var args = getOpt.parseSystem();
// validate mandatory arguments
if (args.argv.length == 0) {
	console.log('missing arguments passed to wget');
	getOpt.showHelp();
	process.exit(3);
}

var Plugin = require('./lib/index.js');
// create a new plugin object with optional initialization parameters
var o = new Plugin({
	// shortName is used in output
	shortName : 'wget_http'
});
// set monitor thresholds
o.setThresholds({
	'critical' : args.options.critical || 2,
	'warning' : args.options.warning || 0.2
});

// run the check - replace with your own business logic
var exec = require('child_process').exec;
var before = new Date().getTime();
exec('wget -qO- ' + args.argv.join(' '), function(error, stdout, stderr) {
	var after = new Date().getTime();
	var diff = (after - before) / 1000;

	// check actual data against predefined threshold
	// and returns state: OK, WARNING or CRITICAL
	var state = o.checkThreshold(diff);
	// Add message for later output. Multiple messages
	// in the same state are concatenated at output
	o.addMessage(state, stdout.length + ' bytes in ' + diff
			+ ' seconds response time.');
	// use get() method to retrieved parsed program arguments
	if (args.options.match && stdout.indexOf(args.options.match) === -1) {
		o.addMessage(o.states.CRITICAL, args.options.match + ' not found');
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
