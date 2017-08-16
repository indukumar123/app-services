(function() {
    'use strict';

    angular
        .module('agentPortal')
        .directive('messageDisplay', messageDisplayDirective);

    function messageDisplayDirective () {
        return {
            restrict: 'E',
            scope: {
                message: '=apiMessage',
                onAcknowledgementAccepted: '&',
                onAcknowledgementUnaccepted: '&'
            },
            templateUrl: 'app/messages/messageDisplay.html',
            controller: messageDisplayDirectiveController,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    function messageDisplayDirectiveController() {
        var vm = this;

        vm.hasAcknowledgements = function () {
            return vm.message && vm.message.acknowledgements && vm.message.acknowledgements.length > 0;
        };

        vm.acknowledgements = function () {
            if (vm.hasAcknowledgements()) {
                return vm.message.acknowledgements;
            }

            return null;
        }
    }

})();