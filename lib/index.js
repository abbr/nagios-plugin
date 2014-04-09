'use strict';
function f(opts) {
	/* jshint validthis: true */
	this.opts = opts;
	this.pOpts = [ {
		'spec' : 'help|?|h',
		'help' : 'Print detailed help screen'
	} ];
}
module.exports = f;
f.prototype.addArg = function(argObj) {
	this.pOpts.push(argObj);
};

f.prototype.getOpts = function() {
	if (process.argv.indexOf('--usage') >= 0) {
		console.log(this.opts.usage);
	} else if (process.argv.indexOf('--help') >= 0) {
		process.stdout.write(this.opts.usage ? this.opts.usage + '\n' : '');
		for ( var i in this.pOpts) {
			var specA = this.pOpts[i].spec.split('=');
			var nA = specA[0].split('|');
			var short = [], long = [];
			for ( var j in nA) {
				if (nA[j].length > 1) {
					long.push(nA[j]);
				} else {
					short.push(nA[j]);
				}
			}
			var specL = '';
			if (short.length > 0) {
				specL += '-' + short.join(', -');
			}
			if (long.length > 0) {
				if (specL.length > 1) {
					specL += ', ';
				}
				specL += '--' + long.join(', --');
			}
			if (specA[1]) {
				specL += '=' + specA[1];
			}
			console.log(specL);
			console.log('  ' + this.pOpts[i].help);
		}
	}
};

f.prototype.setThresholds = function(t) {
	this.threshold = require('util')._extend(this.threshold || {}, t);
};

f.prototype.checkThreshold = function() {
};

f.prototype.addMessage = function() {
};

f.prototype.addPerfdata = function() {
};

f.prototype.nagiosExit = function() {
};
