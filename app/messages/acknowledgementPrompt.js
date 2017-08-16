(function() {
    'use strict';

    angular
        .module('agentPortal')
        .directive('acknowledgementPrompt', acknowledgementPromptDirective);

    function acknowledgementPromptDirective () {
        return {
            restrict: 'E',
            scope: {
                acknowledgement: '=',
                onAcknowledgementAccepted: '&',
                onAcknowledgementUnaccepted: '&'
            },
            templateUrl: 'app/messages/acknowledgementPrompt.html',
            controller: acknowledgementPromptDirectiveController,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    function acknowledgementPromptDirectiveController() {
        var vm = this;

        vm.isNoSelected = false;
        vm.isYesSelected = false;
        vm.wasYesSelected = false;

        vm.message = function () {
            return vm.acknowledgement.message || '';
        };

        vm.noClicked = function () {
            vm.isYesSelected = false;

            updateAcknowledgementAcceptanceStatus(vm.wasYesSelected, vm.isYesSelected);
        };

        vm.yesClicked = function () {
            vm.isNoSelected = false;

            updateAcknowledgementAcceptanceStatus(vm.wasYesSelected, vm.isYesSelected);
            // track whether yes was originally selected/accepted for the next click..
            vm.wasYesSelected = vm.isYesSelected;
        };

        function updateAcknowledgementAcceptanceStatus(wasYesSelected, isYesSelected) {
            if (wasYesSelected && !isYesSelected) {
                // 'yes' was checked, but now it isn't.  fire the callback, if one exists.
                if (vm.onAcknowledgementUnaccepted) {
                    vm.onAcknowledgementUnaccepted()(vm.acknowledgement);
                }
            }
            else if (!wasYesSelected && isYesSelected) {
                // 'yes was not selected, but now it is.  fire the callback, if one exists.
                if (vm.onAcknowledgementAccepted) {
                    vm.onAcknowledgementAccepted()(vm.acknowledgement);
                }
            }
        }
    }

})();