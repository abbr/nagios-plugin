nagios-plugin
=============

Toolkit facilitates writing Nagios plugins, mimic Perl [Nagios::Plugin](http://search.cpan.org/~tonvoon/Nagios-Plugin-0.36/lib/Nagios/Plugin.pm) module.

## Features
* Auto generate CLI --help, --usage, --version outputs
* Auto parse program arguments into JavaScript objects
* Auto check missing mandatory arguments
* Option to auto forbid unexpected arguments

## Annotated Working Example
Following script implements a plugin to use external program `wget` to check a web site. This plugin addresses some defects in Nagios built-in plugin check_http, for instance unable to failover to next IP when a web site is mapped to multiple IPs and attempts to connect to first IP failed at TCP socket layer.

test.js:
```
'use strict';
var Plugin = require('nagios-plugin');
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
o.getOpts();
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

```
Outputs
```
$ node test.js --wget="http://www.google.com"
WGET_HTTP WARNING - 11775 bytes in 0.617 seconds response time.|time=0.617s;0.2;2;; size=11775B;;;;
$ node test.js --wget="http://www.google.com" --match=unicorn
WGET_HTTP CRITICAL - unicorn not found|time=0.471s;0.2;2;; size=11763B;;;;
$ node test.js                                               
missing argument --wget=<STRING>
$ node test.js --usage                       
Usage: node test.js [-c|--critical=<STRING>] [-h|--help] [-m|--match=<STRING>] [-?|--usage] [-v|--verbo
se] [-V|--version] [-w|--warning=<STRING>] --wget=<STRING>
$ node test.js --help 
Usage: node test.js [-c|--critical=<STRING>] [-h|--help] [-m|--match=<STRING>] [-?|--usage] [-v|--verbo
se] [-V|--version] [-w|--warning=<STRING>] --wget=<STRING>
-c, --critical=<STRING>
  Critical threshold
-h, --help
  Print detailed help screen
-m, --match=<STRING>
  String response body must match
-?, --usage
  Print usage information
-v, --verbose
  Show details for command-line debugging
-V, --version
  Print version information
-w, --warning=<STRING>
  Warning threshold
--wget=<STRING>
  Arguments passed to wget
```

## API
* addArg

	```
	addArg({
	  spec:'m|myArg<=...>',
	  help: 'help message',
	  required: true
	})
	```
	* spec may contain multiple arguments aliasing to each other. Following *nix convention single character arguments are supplied in the program argument with prefix - and multi character arguments are prefixed with --. In addition, multiple single character arguments can be concatenated with one - prefix.
	* spec takes optional value type `<=...>` such as `=<STRING>` to indicate the argement expects a value rather than just a flag
* getOpts
* get
* setThresholds
* checkThreshold
* addMessage
* checkMessages
* addPerfData
* getRetureMessage
* nagiosExit

## Install
`npm install nagios-plugin`


