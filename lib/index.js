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
(function() {
	function f(opts) {
		/* jshint validthis: true */
		this.opts = opts || {};
		this.opts.args = this.opts.args || [];
		this.parsedArgs = require('node-getopt').create(this.opts.args).bindHelp()
				.parseSystem();
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
					+ (this.perfData[pdi].threshold
							&& this.perfData[pdi].threshold.warning || '');
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
})();