(function() {
    'use strict';

/**
 * @ngdoc service
 * @name responsiveService
 *
 * # responsiveService
 *
 * @description
 * provides some helper methods to programmatically detect screen-size and accordingly make decisions
 * primarily used in top-navigation drop-down menu's collapse-related-function currently
 */

    angular.module('agentPortal')
        .service('responsiveService', ['$rootScope','$window', responsiveService]);

    function responsiveService($rootScope, $window) {

//        angular.element($window).bind('resize', function () {
//            $rootScope.$emit('windowResizeEvent', [{}]);
//        });

        return {

            /**
             * @description
             * returns true if running on extra small device
             */
            runningOnExtraSmallDevice: function () {
                return $('.device-xs').is(':visible');
            },

            /**
             * @description
             * returns true if running on extra small device
             */
            /**
             * @description
             * returns true if running on small device
             */
            runningOnSmallDevice: function () {
                return $('.device-sm').is(':visible');
            },

            /**
             * @description
             * returns true if running on medium device
             */
            runningOnMediumDevice: function () {
                return $('.device-md').is(':visible');
            },

            /**
             * @description
             * returns true if running on large device
             */
            runningOnLargeDevice: function () {
                return $('.device-lg').is(':visible');
            }

        };
    }
})();