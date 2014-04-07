'use strict';
function f(opts) {
	/* jshint validthis: true */
	this.opts = opts;
	this.pOpts = [ {
		'spec' : 'help|?|h',
		'help' : 'Print detailed help screen'
	} ];
	console.log(process.argv.join(' '));
	if (process.argv.indexOf('--help') >= 0) {
		// TODO: add help
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
}
module.exports = f;
f.prototype.addArg = function() {
};

f.prototype.setThresholds = function() {
};

f.prototype.checkThreshold = function() {
};

f.prototype.addMessage = function() {
};

f.prototype.addPerfdata = function() {
};

f.prototype.nagiosExit = function() {
};
