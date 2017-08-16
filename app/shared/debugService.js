(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('debugService', ['$rootScope', '$compile', debugService]);

    function debugService($rootScope, $compile) {
        var scope = $rootScope.$new();

        return {
            startDebug: startDebug,
            stopDebug: stopDebug
        };

        function startDebug() {
            // Add div for showing debug info if none are there yet
            if (angular.element('.debuglog').length === 0) {
                var debuglog = angular.element('<div class="debuglog" style="display:block; height:500px; border:1px solid; background-color:#ccc; margin-left:300px; padding:5px; overflow: scroll;"></div>');
                $compile(debuglog)(scope);
                angular.element('body').append(debuglog);
            }

            if (typeof console !== "undefined" && typeof console.log !== "undefined") {
                // Saves the old console.log method for reverting back when stopping debug
                console.olog = console.log;
                console.oinfo = console.info;
                console.owarn = console.warn;
                console.oerror = console.error;

                // Sets up new logging methods to be called
                console.log = customLog;
                console.info = customLog;
                console.warn = customLog;
                console.error = customLog;
            }
        }

        function stopDebug() {
            // Reset old log method to logging
            console.log = console.olog;
            console.info = console.olog;
            console.warn = console.olog;
            console.error = console.olog;

            console.olog = undefined;
            console.oinfo = undefined;
            console.owarn = undefined;
            console.oerror = undefined;

            // We could hide/remove the debug <div> at this point but keeping it around for now
        }

        function customLog(message) {
            // Runs old console log - keeps original logging functionality working
            console.olog(message);

            // Runs debug logging
            logToUI(message);
        }

        function logToUI(message) {
            // Append to the div log
            var msg = angular.element('<p style="margin:0px;">' + message + '</p>');
            $compile(msg)(scope);
            angular.element('.debuglog').append(msg);
        }
    }
})();
