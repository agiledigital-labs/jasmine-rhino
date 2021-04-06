window = this;
var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    endAllTimers;

(function () {
    var timer = new java.util.Timer();
    var counter = 1;
    var ids = {};


    setTimeout = function (fn,delay) {
    // Temporarily disabled due to incompatibility with R4 of Rhino
        if(!delay) fn();
    };

    clearTimeout = function (id) {
    // Temporarily disabled due to incompatibility with R4 of Rhino
//        if(ids[id]) {
//            ids[id].cancel();
//            timer.purge();
//            delete ids[id];
//        }
    };

    setInterval = function (fn,delay) {
    // Temporarily disabled due to incompatibility with R4 of Rhino
//        var id = counter += 1;
//        ids[id] = new JavaAdapter(java.util.TimerTask,{run: fn});
//        timer.schedule(ids[id],delay,delay);
//        return id;
    };

    clearInterval = clearTimeout;

/*** added ***/
    endAllTimers = function () {
        timer.cancel();
    };

}());
