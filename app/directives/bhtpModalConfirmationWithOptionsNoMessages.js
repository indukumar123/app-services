(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpModalConfirmationWithOptionsNoMessages
     *
     * # bhtpModalConfirmationWithOptionsNoMessages
     *
     * @description
     * modal dialog for actions requiring confirmation from the user
     */
    angular.module('agentPortal')
        .directive('bhtpModalConfirmationWithOptionsNoMessages', [bhtpModalConfirmationWithOptionsNoMessagesDirective]);

    function bhtpModalConfirmationWithOptionsNoMessagesDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                title: '@',
                mainmessage: '@',
                modalbuttons: '=',
            },
            templateUrl: 'app/layout/modalconfirmationwithoptionsnomessages.html'
        };
    }
}());