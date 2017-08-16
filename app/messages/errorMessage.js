(function() {
    'use strict';

    angular
        .module('agentPortal')
        .directive('errorMessage', errorMessageDirective);

    function errorMessageDirective () {
        return {
            restrict: 'E',
            scope: {
                message: '='
            },
            templateUrl: 'app/messages/errorMessage.html',
            controller: errorMessageDirectiveController,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    errorMessageDirectiveController.$inject = ['format'];
    function errorMessageDirectiveController(format) {
        var vm = this;

        vm.formattedMessage = function () {
            return format.formatDisplayMessage(vm.message);
        };
    }

})();