(function() {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpModalConfirmation
     *
     * # bhtpModalConfirmation
     *
     * @description
     * modal dialog for actions requiring confirmation from the user
     */
    angular.module('agentPortal')
        .directive('bhtpModalConfirmation', [bhtpModalConfirmationDirective]);

    function bhtpModalConfirmationDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                title: '@',
                message: '@',
                yes: '@',
                no: '@',
                action: '&',
                entityIds: '='
            },
            templateUrl: 'app/layout/modalconfirmation.html'
        };
    }
}());