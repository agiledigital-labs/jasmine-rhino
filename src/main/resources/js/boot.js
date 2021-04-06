// Modified from rhino-boot.js (https://gist.github.com/dingchenCN/ae9d1b83a486793eb6f0)
// this need to be load before the test specs
jasmine = jasmineRequire.core(jasmineRequire);

var env = jasmine.getEnv();

var jasmineInterface = {
    describe: function(description, specDefinitions) {
        return env.describe(description, specDefinitions);
    },

    xdescribe: function(description, specDefinitions) {
        return env.xdescribe(description, specDefinitions);
    },

    it: function(desc, func) {
        return env.it(desc, func);
    },

    xit: function(desc, func) {
        return env.xit(desc, func);
    },

    beforeEach: function(beforeEachFunction) {
        return env.beforeEach(beforeEachFunction);
    },

    afterEach: function(afterEachFunction) {
        return env.afterEach(afterEachFunction);
    },

    expect: function(actual) {
        return env.expect(actual);
    },

    pending: function() {
        return env.pending();
    },

    spyOn: function(obj, methodName) {
        return env.spyOn(obj, methodName);
    },

    jsApiReporter: new jasmine.JsApiReporter({
        timer: new jasmine.Timer()
    })
};

/**
* Add all of the Jasmine global/public interface to the proper global, so a project can use the public interface directly. For example, calling `describe` in specs instead of `jasmine.getEnv().describe`.
*/
if (typeof window == "undefined" && typeof exports == "object") {
    extend(exports, jasmineInterface);
} else {
    extend(window, jasmineInterface);
}

/**
* Expose the interface for adding custom equality testers.
*/
jasmine.addCustomEqualityTester = function(tester) {
    env.addCustomEqualityTester(tester);
};

/**
* Expose the interface for adding custom expectation matchers
*/
jasmine.addMatchers = function(matchers) {
    return env.addMatchers(matchers);
};

/**
* Expose the mock interface for the JavaScript timeout functions
*/
jasmine.clock = function() {
    return env.clock;
};

/**
* Helper function for readability above.
*/
function extend(destination, source) {
for (var property in source) destination[property] = source[property];
    return destination;
}