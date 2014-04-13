'use strict';

Object.defineProperty(Object.prototype, 'getKeyByValue', {
	enumerable : false,
	value : function(value) {
		for ( var prop in this) {
			if (this.hasOwnProperty(prop)) {
				if (this[prop] === value) {
					return prop;
				}
			}
		}
	}
});

function f(opts) {
	/* jshint validthis: true */
	this.opts = opts || {};
	this.pOpts = [ {
		'spec' : 'help|h',
		'help' : 'Print detailed help screen'
	}, {
		'spec' : 'v|verbose',
		'help' : 'Show details for command-line debugging'
	}, {
		'spec' : 'V|version',
		'help' : 'Print version information'
	}, {
		'spec' : '?|usage',
		'help' : 'Print usage information'
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

f.prototype.parseArgs = function() {
	// parse opts
	for ( var i in this.pOpts) {
		var specA = this.pOpts[i].spec.split('=');
		var nA = specA[0].split('|');
		var short = [], long = [];
		for ( var j in nA) {
			var insertIdx = 0, k;
			if (nA[j].length > 1) {
				for (k = 0; k < long.length; k++) {
					if (long[k] > nA[j]) {
						insertIdx = k;
						break;
					}
				}
				long.splice(insertIdx, 0, nA[j]);
			} else {
				for (k = 0; k < short.length; k++) {
					if (short[k] > nA[j]) {
						insertIdx = k;
						break;
					}
				}
				short.splice(insertIdx, 0, nA[j]);
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
			this.pOpts[i].specValue = specA[1];
			specL += '=' + specA[1];
		}
		this.pOpts[i].specL = specL;
		this.pOpts[i].shortArgs = short;
		this.pOpts[i].longArgs = long;
	}
	this.pOpts.sort(function(a, b) {
		var av = (a.longArgs.length > 0) ? a.longArgs[0] : a.shortArgs[0];
		var bv = (b.longArgs.length > 0) ? b.longArgs[0] : b.shortArgs[0];
		return av > bv;
	});
	// populate usage if not set
	if (!this.opts.usage) {
		var usgStr = 'Usage: node ' + require('path').basename(process.argv[1])
				+ ' ';

		this.pOpts.forEach(function(v) {
			if (!v.required) {
				usgStr += '[';
			}
			if (v.shortArgs.length > 0) {
				usgStr += '-' + v.shortArgs.join('|-');
				if (v.longArgs.length > 0) {
					usgStr += '|';
				}
			}
			if (v.longArgs.length > 0) {
				usgStr += '--' + v.longArgs.join('|--');
			}
			if (v.specValue) {
				usgStr += '=' + v.specValue;
			}
			if (!v.required) {
				usgStr += ']';
			}
			usgStr += ' ';
		});
		this.opts.usage = usgStr;
	}

	// parse process arguments
	var invalidArgs = [];

	var iterator = function(v) {
		var lsArgs = nvPair[0].length > 1 ? v.longArgs : v.shortArgs;
		if (lsArgs.indexOf(nvPair[0]) > -1) {
			v.suppliedValue = nvPair[1] || true;
			return false;
		}
		return true;
	};

	for (i = 2; i < process.argv.length; i++) {
		var nvPair;
		if (String(process.argv[i]).match(/^--/)) {
			// long
			nvPair = process.argv[i].substr(2).split('=');
			if (this.pOpts.every(iterator)) {
				invalidArgs.push('--' + nvPair[0]);
			}
		} else if (String(process.argv[i]).match(/^-/)) {
			// short
			var shortStr = process.argv[i].substr(1);
			for ( var shortStrIdx = 0; shortStrIdx < shortStr.length; shortStrIdx++) {
				nvPair = [];
				nvPair.push(shortStr[shortStrIdx]);
				if (shortStrIdx === (shortStr.length - 1)) {
					if (process.argv[i + 1] && !String(process.argv[i + 1]).match(/^-/)) {
						nvPair.push(String(process.argv[i + 1]));
					}
				}
				if (this.pOpts.every(iterator)) {
					invalidArgs.push('-' + nvPair[0]);
				}
			}
		}
	}

	if (this.get('version')) {
		console.log(this.opts.version);
		process.exit(0);
	}
	if (this.get('usage')) {
		console.log(this.opts.usage);
		process.exit(0);
	}
	if (this.get('help')) {
		process.stdout.write(this.opts.usage ? this.opts.usage + '\n' : '');
		for (i in this.pOpts) {
			console.log(this.pOpts[i].specL);
			console.log('  ' + this.pOpts[i].help);
		}
		process.exit(0);
	}
	if (this.opts.allowUnexpectedArgs !== true && invalidArgs.length > 0) {
		console.log('invalid argument' + (invalidArgs.length > 1 ? 's' : '') + ' '
				+ invalidArgs.join(' '));
		process.exit(3);
	}
	// check required opts
	var missingArgs = [];
	this.pOpts
			.forEach(function(v) {
				if (!v.required || v.suppliedValue) {
					return;
				}
				missingArgs
						.push(v.longArgs.length > 0 ? ('--' + v.longArgs[0] + (v.specValue ? '='
								+ v.specValue
								: ''))
								: ('-' + v.shortArgs[0] + (v.specValue ? ' ' + v.specValue : '')));
			});
	if (missingArgs.length > 0) {
		console.log('missing argument' + (missingArgs.length > 1 ? 's' : '') + ' '
				+ missingArgs.join(' '));
		process.exit(3);
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

f.prototype.getReturnMessage = function(code, msg) {
	var ret = (this.opts.shortName || require('path').basename(process.argv[1],
			'.js')).toUpperCase();
	ret += ' ' + this.states.getKeyByValue(code) + ' - ';
	ret += msg;
	if (!this.perfData) {
		return ret;
	}
	ret += '|';
	var pda = [];
	for ( var pdi in this.perfData) {
		var pds = this.perfData[pdi].label;
		pds += '=' + this.perfData[pdi].value;
		pds += this.perfData[pdi].uom;
		pds += ';'
				+ (this.perfData[pdi].threshold && this.perfData[pdi].threshold.warning || '');
		pds += ';'
				+ (this.perfData[pdi].threshold
						&& this.perfData[pdi].threshold.critical || '');
		pds += ';'
				+ (this.perfData[pdi].min === undefined ? '' : this.perfData[pdi].min);
		pds += ';'
				+ (this.perfData[pdi].max === undefined ? '' : this.perfData[pdi].max);
		pda.push(pds);
	}
	ret += pda.join(' ');
	return ret;
};
f.prototype.nagiosExit = function(code, msg) {
	console.log(this.getReturnMessage(code, msg));
	process.exit(code);
};

f.prototype.get = function(optName) {
	var retVal;
	this.pOpts.every(function(v) {
		var checkArgs = optName.length === 1 ? v.shortArgs : v.longArgs;
		if (checkArgs.indexOf(optName) > -1) {
			retVal = v.suppliedValue || undefined;
			return false;
		}
		return true;
	});
	return retVal;
};