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
        .directive('bhtpModalConfirmationWithOptions', [bhtpModalConfirmationWithOptionsDirective]);

    function bhtpModalConfirmationWithOptionsDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                title: '@',
                mainmessage: '@',
                messages: '=',
                modalbuttons: '=',
            },
            templateUrl: 'app/layout/modalconfirmationwithoptions.html'
        };
    }
}());