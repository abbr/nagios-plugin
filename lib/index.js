'use strict';
function f(opts) {
	/* jshint validthis: true */
	this.opts = opts;
	this.pOpts = [ {
		'spec' : 'help|?|h',
		'help' : 'Print detailed help screen'
	} ];
	this.messages = [ '', '', '', '' ];
	this.perfData = [];
}
module.exports = f;

f.prototype.states = {
	OK : 0,
	WARNING : 1,
	CRITICAL : 2,
	UNKNOWN : 3
};

f.prototype.addArg = function(argObj) {
	this.pOpts.push(argObj);
};

f.prototype.getOpts = function() {
	if (process.argv.indexOf('--usage') >= 0) {
		console.log(this.opts.usage);
	} else if (process.argv.indexOf('--help') >= 0) {
		process.stdout.write(this.opts.usage ? this.opts.usage + '\n' : '');
		for ( var i = 0; i < this.pOpts.length; i++) {
			var specA = this.pOpts[i].spec.split('=');
			var nA = specA[0].split('|');
			var short = [], long = [];
			for ( var j = 0; j < nA.length; j++) {
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

f.prototype.isInRange = function(a, r) {
	var cr = {
		min : Number.NEGATIVE_INFINITY,
		max : Number.POSITIVE_INFINITY,
		negate : false
	};
	r = r.toString().trim();
	if (r.substr(0, 1) === '@') {
		r = r.slice(1);
		cr.negate = true;
	}
	if (r.indexOf(':') < 0) {
		cr.min = 0;
		cr.max = Number(r);
	} else {
		var ra = r.split(':');
		cr.min = Number(ra[0]);
		cr.max = Number(ra[1]) || cr.max;
	}
	var check = (a >= cr.min) && (a <= cr.max);
	return cr.negate ? check : !check;
};

f.prototype.checkThreshold = function(actual) {
	if (this.isInRange(actual, this.threshold.critical)) {
		return this.states.CRITICAL;
	} else if (this.isInRange(actual, this.threshold.warning)) {
		return this.states.WARNING;
	} else {
		return this.states.OK;
	}
};

f.prototype.addMessage = function(s, m) {
	this.messages[s] += m;
};

f.prototype.checkMessages = function() {
	for ( var i = 3; i >= 0; i--) {
		if (this.messages[i].length > 0) {
			return {
				state : i,
				message : this.messages[i]
			};
		}
	}
};

f.prototype.addPerfData = function(p) {
	this.perfData.push(p);
};

f.prototype.nagiosExit = function() {
};
