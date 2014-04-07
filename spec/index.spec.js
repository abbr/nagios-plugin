'use strict';

function hookStdout(callback) {
  var oldWrite = process.stdout.write;
  // jshint unused: false
  process.stdout.write = (function(write) {
    return function(string, encoding, fd) {
      // write.apply(process.stdout, arguments);
      callback(string, encoding, fd);
    };
  })(process.stdout.write);

  return function() {
    process.stdout.write = oldWrite;
  };
}

describe('Invoking lib/index.js,', function() {
  var F;
  F = require('../lib/index');
  var o = new F({
    a : 'pass',
    usage : 'Usage: ...'
  });
  var outStr, unhook;
  beforeEach(function() {
    outStr = '';
    unhook = hookStdout(function(string) {
      outStr += string;
    });
  });
  afterEach(function() {
    unhook();
  });

  it('defined functions',function(){
    expect(o.addArg).toBeDefined();
    expect(o.getOpts).toBeDefined();
    expect(o.setThresholds).toBeDefined();
    expect(o.checkThreshold).toBeDefined();
    expect(o.addMessage).toBeDefined();
    expect(o.addPerfdata).toBeDefined();
    expect(o.nagiosExit).toBeDefined();
  });
  describe('passing argument --usage,', function() {
    var oldArgv;
    beforeEach(function() {
      oldArgv = process.argv;
      process.argv = [ 'node', __filename, '--usage' ];
    });
    afterEach(function() {
      process.argv = oldArgv;
    });
    it('calling method getOpts()', function() {
      o.getOpts();
      expect(outStr).toContain('Usage:');
    });
  });

  describe('passing argument --help,', function() {
    var oldArgv;
    beforeEach(function() {
      oldArgv = process.argv;
      process.argv = [ 'node', __filename, '--help' ];
    });
    afterEach(function() {
      process.argv = oldArgv;
    });
    it('calling method getOpts()', function() {
      o.getOpts();
      expect(outStr).toContain('Print detailed help screen');
    });
  });
});
