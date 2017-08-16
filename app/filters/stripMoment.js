/*global angular */
/*jshint globalstrict: true*/

(function () {
    'use strict';
    angular.module('agentPortal')
        .filter('stripMoment', function () {
            return function (input, format) {

                if (!input) return null;

                var output = input.substring(0, 10);

                var momentDate = moment(output);

                output = momentDate.format(format);

                return output;
            };
        });
})();