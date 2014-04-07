'use strict';
var F = require('./lib/index.js');
var o = new F({a:"pass", usage:"sdf"});
process.stdout.write(o.opts.a);
