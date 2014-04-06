'use strict';
function f(opts) {
	this.opts = opts;
	this.pOpts = [ {
		"spec" : "help|h=s",
		"help" : "Print detailed help screen"
	} ];
	if (process.argv.indexOf('--help') >= 0) {
		// TODO: add help
		process.stdout.write(this.opts.usage ? this.opts.usage + '\n' : '');
		for ( var i in this.pOpts) {
			var specA = this.pOpts[i].spec.split('=');
			var nA = specA[0].split('|');
			var specL = nA[1] ? '-' + nA[1] + ', ' : '';
			specL += '--' + nA[0];
			if (specA[1]) {
				specL += '=';
				switch (specA[1]) {
				case 's':
					specL += 'STRING';
					break;
				case 'i':
					specL += 'INTEGER';
					break;
				default:
					specL += specA[1];
					break;
				}
			}
			console.log(specL);
			console.log('  ' + this.pOpts[i].help);
		}
	}
};
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
