nagios-plugin
=============

Toolkit facilitates writing Nagios plugins in Node.js. It's a mimic of Perl [Nagios::Plugin](http://search.cpan.org/~tonvoon/Nagios-Plugin-0.36/lib/Nagios/Plugin.pm) module.

## Features
* Auto generate CLI --help, --usage, --version outputs
* Auto parse arguments into JavaScript objects
* Auto check missing mandatory arguments
* Option to auto forbid unexpected arguments

## Annotated Working Example
Following script implements a plugin to use external program `wget` to check a web site. This plugin addresses some defects in Nagios built-in plugin check_http, for instance unable to failover to next IP when a web site is mapped to multiple IPs and attempts to connect to currently chosen IP failed at TCP socket layer.

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
// parse and validate arguments
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
	// use get() method to retrieved parsed arguments
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
### constructor
	```
	var o = new Plugin({
		shortName : 'wget_http',
		version : '0.0.1',
		allowUnexpectedArgs: true,
		usage: 'Usage: ...'
	});
	```
* shortName is used in output, if omitted by default it is set to JavaScript file name
* if allowUnexpectedArgs is true, unexpected arguments won't cause process termination when calling `getOpts()`
* usage is auto-generated if omitted.

### properties
* `opts`

  	constructor options (see [constructor](#constructor) above).
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
* addArg

	```
	o.addArg({
	  spec:'m|myArg<=...>',
	  help: 'help message',
	  required: true
	})
	```
	* spec may contain multiple arguments aliasing to each other. Following *nix convention single character arguments are supplied in the argument with prefix - and multi character arguments are prefixed with --. In addition, multiple single character arguments can be concatenated with one - prefix.
	* spec takes optional value type `<=...>` such as `=<STRING>` to indicate the argement expects a value rather than just a flag
* getOpts
	```
	o.getOpts()
	```

	This methods should be called after all `addArg`. It performs following actions
	1. parse and sort all specs supplied with `addArg`
	2. compose usage string if not supplied
	3. parse arguments
	4. output version, usage, or help information and quit if asked so
	5. if allowUnexpectedArgs is not true, report unexpected arguments and quit if found
	6. report missing mandatory arguments and quit if found
* get
  
	```
	var value = o.get(name)
	```
	get the value of a spec
	* `get` must be called after `getOpts`
	* the value returned is:
		* value supplied in the argument if available
		* `true` if spec is a flag (no value)
		* `undefined` if spec is not supplied in the argument
	* if allowUnexpectedArgs is true, unexpected arguments are not retrievable by `get`. You must parse process.argv yourself.
	

* setThresholds
	```
	o.setThresholds({
		'critical' : ...,
		'warning' : ...
	});
	```
	See [Nagios Plugin Development Guidelines](https://nagios-plugins.org/doc/guidelines.html#THRESHOLDFORMAT) for valid threshold formats
	* There is only one critical and warning threshold set. If `setThresholds` is called multiple times, the result is concatenated and latter settings take precedence.
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


