(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpModalConfirmationWithOptions
     *
     * # bhtpModalConfirmationWithOptions
     *
     * @description
     * modal dialog for actions requiring confirmation from the user
     */
    angular.module('agentPortal')
        .directive('bhtpModalCanSell', [bhtpModalCanSell]);

    function bhtpModalCanSell() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                residenceLocation: '@',
                showsendquote: '@',
                modalbuttons: '=',
            },
            templateUrl: 'app/layout/modalcansell.html'
        };
    }
}());