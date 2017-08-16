(function () {
    'use strict';

    /**
     * Policy Buyer Directive
     * 
     * Accepts a traveler model to represent the policy buyer
     */

    angular
        .module('agentPortal')
        .directive('policyBuyer', policyBuyerDirective);

    function policyBuyerDirective() {
        return {
            restrict: 'E',
            scope: {
                policyBuyer: '=',
                states: '='
            },
            templateUrl: 'app/directives/policybuyer/policyBuyerDirective.html',
            controller: policyBuyerController,
            controllerAs: "vm",
            bindToController: true
        }
    }

    policyBuyerController.$inject = ['utilService', 'eligibilityService'];

    function policyBuyerController(utilService, eligibilityService) {
        var vm = this;

        vm.packageStateConfig = null;

        function init() {
            utilService.setConstants(vm);

            if (!vm.packageStateConfig) {
                vm.packageStateConfig = eligibilityService.getPackageStateConfiguration();
            }
        };

        vm.openDatePicker = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.policyBuyer.dateOfBirthDatePicker = true;
        };

        vm.keypressCallback = function (event) {
            // backspace or delete
            if (event.keyCode === 8 || event.keyCode === 46) {
                var element = angular.element('#' + event.target.id);
                $timeout(function () {
                    element.triggerHandler('input');
                });
            }
        };

        /**
         * @description
         * On change event for no email addess checkbox, clears email when value is true
         */
        vm.onNoEmailAddressChange = function onNoEmailAddressChange(noEmailAddress) {
            if (noEmailAddress) {
                vm.policyBuyer.emailAddress = null;
            }
        };

        /**
         * @description
         * On change event for PolicyBuyer email, sets noEmailAddress to false when there is a value set
         */
        vm.onPolicyBuyerEmailAddressKeyUp = function onPolicyBuyerEmailAddressKeyUp(event) {
            // use key up instead of change because the html input[type=email] only throws the change event when you type the first character after the @ char
            // for example if you type 'abc@d' the change event will only fire once you type d
            if (vm.policyBuyer.noEmailAddress && event && event.target && event.target.value && event.target.value.length > 0) {
                vm.policyBuyer.noEmailAddress = false;
            }
        };

        init();
    }
})();