(function () {
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
        .directive('superusermodalconfirmation', [superusermodalconfirmation]);

    function superusermodalconfirmation() {
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
                agentIds: '='
            },
            templateUrl: 'app/layout/superUserModalConfirmation.html'
        };
    }
}());