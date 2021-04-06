const _ = require('lib/lodash');
var openidm, identityServer, logger, withSpy, injectedGlobalMocks, withMocks, requireWithMocks;
const global = this;

beforeEach(function() {
    // Mock out all methods from the openidm object with blank spies
    openidm = jasmine.createSpyObj('openidm', [
        'create',
        'patch',
        'read',
        'update',
        'delete',
        'query',
        'action',
        'encrypt',
        'decrypt',
        'isEncrypted',
        'hash',
        'isHashed',
        'matches'
    ]);

    identityServer = jasmine.createSpyObj('identityServer', [
        'getProperty'
    ]);

    // Pass all logging calls to println
    const print = function(str) {
        var i = 1;
        while(arguments[i]) {
            str = str.replace("{}", arguments[i]);
            i ++;
        }
        // Lets log messages to stderr instead, meaning we can filter them out if necessary with "2>/dev/null"
        java.lang.System.err.println(str)
    };

    logger = {
        debug: print,
        info: print,
        error: print,
        trace: print,
        warn: print
    };

    // Syntactic sugar for adding return values to blank spies
    withSpy = function(spy) {
        return spy.and;
    };
});

// Helper function to execute a function with mocks temporarily loaded into global state.
// This allows mocks to be injected in place of imported modules
// see roles/openidm/files/scripts/inject.js
withMocks = function(mocks, fn) {
    injectedGlobalMocks = mocks;
    const result = fn();
    injectedGlobalMocks = undefined;
    return result;
}

// Helper function to require a module with mocks temporarily loaded into global state.
// This allows mocks to be injected in place of imported modules
// see roles/openidm/files/scripts/inject.js
requireWithMocks = function(path, mocks) {
    return withMocks(mocks, function() {
        return require(path);
    });
};

// Reset the calls count for all spies within a set of mocks
resetMocks = function(mocks) {
    _.forOwn(mocks, function(mock) {
        _.forOwn(mock, function(spy, spyName) {
            spy.calls.reset();
            spy.and.stub();
        });
    });
};