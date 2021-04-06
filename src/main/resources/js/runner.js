// Modified from rhino-boot.js (https://gist.github.com/dingchenCN/ae9d1b83a486793eb6f0)
// load this after the test specs

/**
   * ## Require &amp; Instantiate
   *
   * Require Jasmine's core files. Specifically, this requires and attaches all of Jasmine's code to the `jasmine` reference.
   */
var jasmineEnv = jasmine.getEnv();

function executeTests(listener) {

    var ConsoleReporter = jasmineRequire.ConsoleReporter();
    var options = {
      showColors: true,
      print: function(s) {
        java.lang.System.out.print(s);
      },
      onComplete: function(result) {
        listener.done(result);
      }
    };

    consoleReporter = new ConsoleReporter(options); // initialize ConsoleReporter
    jasmineEnv.addReporter(consoleReporter); //add reporter to execution environment
    // run tests
    jasmineEnv.execute();
};
