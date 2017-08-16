(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpModalPrimaryTraveler
     *
     * # bhtpModalPrimaryTraveler
     *
     * @description
     * modal dialog for actions requiring confirmation from the user
     */
    angular.module('agentPortal')
        .directive('bhtpModalPrimaryTraveler', [bhtpModalPrimaryTravelerDirective]);

    function bhtpModalPrimaryTravelerDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                title: '@',
                message: '@',
                modalbuttons: '=',
            },
            templateUrl: 'app/layout/modalPrimaryTraveler.html'
        };
    }
}());