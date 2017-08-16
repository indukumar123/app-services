/**
 * @ngdoc filter
 * @name asDate
 *
 * # asDate
 *
 * @description
 * filters date information 
 */
(function () {
    'use strict';

    angular.module('agentPortal')
        .filter('asDate', [asDateFilter]);


    //angular date formatting doesnt work if the input field isnt a date object in the first place
    function asDateFilter() {
        return function (input) {
            return new Date(input);
        };
    }
})();