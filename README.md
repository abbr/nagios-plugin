nagios-plugin
=============

Toolkit facilitates writing Nagios plugins in Node.js. It is a mimic of Perl [Nagios::Plugin](http://search.cpan.org/~tonvoon/Nagios-Plugin-0.36/lib/Nagios/Plugin.pm) module except the command line parsing function is removed in favor of many existing npm modules such as [node-getopt](https://github.com/jiangmiao/node-getopt) or [commander.js](https://github.com/visionmedia/commander.js).

## Annotated Working Example
Following script implements a plugin to check web sites using external program `wget`. This plugin addresses some defects in Nagios built-in plugin check_http, for instance unable to failover to next IP when a web site is mapped to multiple IPs and attempts to connect to currently chosen IP failed at TCP socket layer.

test.js:
```
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
	console.log('missing required param');
	getOpt.showHelp();
	process.exit(3);
}

var Plugin = require('nagios-plugin');
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


```
Outputs
```
$ node test.js -- http://www.google.com
WGET_HTTP WARNING - 11815 bytes in 0.571 seconds response time.|time=0.571s;0.2;2;0; size=11815B;;;0;
$ node test.js --match=unicorn -- http://www.google.com
WGET_HTTP CRITICAL - unicorn not found|time=0.467s;0.2;2;0; size=11763B;;;0;
$ node test.js --help 
Usage: node test.js [Options] -- <arguments passed to wget>
Options:
  -m, --match=<STRING>     String response body must match
  -w, --warning=<STRING>   Warning threshold
  -c, --critical=<STRING>  Critical threshold
  -h, --help               display this help
$ node test.js
missing arguments passed to wget
Usage: ... <same as --help>

```

## API
### constructor

	var o = new Plugin({
		shortName : 'wget_http'
	});
* shortName is used in output, if omitted by default it is set to JavaScript file name launched by program

### properties
* `states`

	enum
	```
	{
		OK : 0,
		WARNING : 1,
		CRITICAL : 2,
		UNKNOWN : 3
	}
	```

### methods
* setThresholds

	```
	o.setThresholds({
		'critical' : ...,
		'warning' : ...
	});
	```
	See [Nagios Plugin Development Guidelines](https://nagios-plugins.org/doc/guidelines.html#THRESHOLDFORMAT) for valid threshold formats
	* There is only one critical and warning threshold set. If `setThresholds` is called multiple times, the result is concatenated and latter settings overwrites previous ones.
* checkThreshold

	```
	var state = o.checkThreshold(actualData);
	```
	check actualData against predefined threshold. Returns the matching state.
* addMessage

	```
	o.addMessage(state, 'msg');
	```
	Add message to the corresponding state.
* checkMessages

	```
	var messageObj = o.checkMessages();
	```
	`checkMessages` concatenates messages added with `addMessage` by state and returns the {state, message} pair of the most severe state with message populated in this precedence: critical, warning or OK.
* addPerfData

	```
	o.addPerfData({
		label : "time",
		value : diff,
		uom : "s",
		threshold : o.threshold,
		min : 0,
		max : 100
	})	
	```
	See [Nagios Plugin Development Guidelines](https://nagios-plugins.org/doc/guidelines.html#AEN200) for valid UOMs.
* nagiosExit

	```
	o.nagiosExit(state, message);
	```
	Generates one line output conforming to [Nagios expected format](https://nagios-plugins.org/doc/guidelines.html#PLUGOUTPUT) and exit the program with state as return code. State and message should come from `checkMessages` output.
* getReturnMessage

	```
	var msg = o.getReturnMessage(state, message);
	```
	If you want the output string but don't want to quit the program by calling `nagiosExit`, you can call `getReturnMessage` with same parameters as `nagiosExit`. Internally `nagiosExit` calls `getReturnMessage`.

## Install
`npm install nagios-plugin`


