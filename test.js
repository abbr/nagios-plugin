'use strict';
var F = require('./index.js');
var o = new F({a:"pass", usage:"sdf"});
process.stdout.write(o.opts.a);
