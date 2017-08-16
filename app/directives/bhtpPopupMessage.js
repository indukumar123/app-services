(function() {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpPopupMessage
     *
     * # bhtpPopupMessage
     *
     * @description
     * generic popup message displaying directive
     */
    angular.module('agentPortal')
        .directive('bhtpPopupMessage', [bhtpPopupMessageDirective]);

    function bhtpPopupMessageDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                modalId: '@',
                title: '@',
                message: '@',
                iconClass: '@'
            },
            templateUrl: 'app/layout/popupmessage.html'
        };
    }
}());