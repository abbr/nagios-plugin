'use strict';
var F = require('./lib/index.js');
var o = new F({
	shortName : 'wget_http'
});
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
o.getOpts();
o.setThresholds({
	'critical' : o.get('critical') || 2,
	'warning' : o.get('warning') || 0.2
});
var exec = require('child_process').exec;
var before = new Date().getTime();
exec('wget -qO- ' + o.get('wget'), function(error, stdout, stderr) {
	var after = new Date().getTime();
	var diff = (after - before) / 1000;
	var state = o.checkThreshold(diff);
	o.addMessage(state, stdout.length + ' bytes in ' + diff
			+ ' seconds response time.');
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
	var messageObj = o.checkMessages();
	o.nagiosExit(messageObj.state, messageObj.message);
});
