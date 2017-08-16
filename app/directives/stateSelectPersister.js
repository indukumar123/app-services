/**
 * @ngdoc directive
 * @name statePerstser
 *
 * # statePerstser
 *
 * @description
 * when the value changes, it will persist the value in the statePersister service
 */

(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('stateSelectPersister', ['statePersister', stateSelectPersister]);

    function stateSelectPersister(statePersister) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('change', function () {
                    statePersister.persist(element[0].value);
                });
            }
        };
    }
}());