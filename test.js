'use strict';
var F = require('./index.js');
var o = new F({a:"pass"});
process.stdout.write(o.opts.a);
