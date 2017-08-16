(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('intentService', intentService);

    intentService.$inject = ['$rootScope'];

    function intentService($rootScope) {
        $rootScope.intent = "Loading...";

        var service = {
            setIntent: setIntent,
            resetIntent: resetIntent
        };

        return service;

        /**
         * @description
         * sets current intent of communicating with the back-end, shows up on spinner
         */
        function setIntent(intent) {
            $rootScope.intent = intent;
        };

        /**
         * @description
         * resets intent to 'Loading...', the default spinner value
         */
        function resetIntent() {
            $rootScope.intent = "Loading...";
        };
    }

})();
