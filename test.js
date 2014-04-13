'use strict';
var Plugin = require('./lib/index.js');
// create a new plugin object with optional initialization parameters
var o = new Plugin({
	// shortName is used in output
	shortName : 'wget_http',
	version : '0.0.1'
});
// add expected arguments
o.addArg({
	'spec' : 'wget=<STRING>',
	'help' : 'Arguments passed to wget',
	'required' : true
});
o.addArg({
	'spec' : 'm|match=<STRING>',
	'help' : 'String response body must match'
});
o.addArg({
	'spec' : 'w|warning=<STRING>',
	'help' : 'Warning threshold'
});
o.addArg({
	'spec' : 'c|critical=<STRING>',
	'help' : 'Critical threshold'
});
// parse and validate program arguments
o.parseArgs();
// set monitor thresholds
o.setThresholds({
	'critical' : o.get('critical') || 2,
	'warning' : o.get('warning') || 0.2
});

// run the check - replace with your own business logic
var exec = require('child_process').exec;
var before = new Date().getTime();
exec('wget -qO- ' + o.get('wget'), function(error, stdout, stderr) {
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
	if (o.get('match') && stdout.indexOf(o.get('match')) === -1) {
		o.addMessage(o.states.CRITICAL, o.get('match') + ' not found');
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
