'use strict';
var F = require('./lib/index.js');
var o = new F({
	shortName : 'wget_http'
});
o.addArg({
	'spec' : 'wget=<STRING>',
	'help' : 'arguments passed to wget',
	'required' : true
});
o.getOpts();
