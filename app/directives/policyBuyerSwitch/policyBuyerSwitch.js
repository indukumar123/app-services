(function () {

    angular
        .module('agentPortal')
        .directive('policyBuyerSwitch', policyBuyerSwitch);

    function policyBuyerSwitch() {
        return {
            restrict: 'E',
            scope: {
                initialValue: '=',
                onStateChangedEvent: '=onStateChanged'
            },
            templateUrl: 'app/directives/policyBuyerSwitch/policyBuyerSwitch.html',
            controller: policyBuyerSwitchCtrl,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    policyBuyerSwitchCtrl.$inject = [];

    function policyBuyerSwitchCtrl() {
        var vm = this;

        vm.toolTipText = 'Cataloging the policy buyer\'s information ensures that the buyer, as well as the primary traveler, is included in policy notifications and can use BHTP\'s consumer site for policy administration and claims.';
        vm.labelText = 'Is this primary traveler also the policy buyer?';

        vm.handleStateChanged = function (newValue) {
            vm.onStateChangedEvent(newValue);
        };
    }
})();