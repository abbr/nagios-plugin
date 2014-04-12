'use strict';
var F = require('./lib/index.js');
var o = new F({
	a : "pass",
	usage : "sdf"
});
o.addArg({
	'spec' : 'm|myArg',
	'help' : 'my argument',
	'required' : true
});
o.getOpts();
