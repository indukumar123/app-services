(function () {

    angular
        .module('agentPortal')
        .directive('bhtpSwitch', bhtpSwitch);

    function bhtpSwitch() {
        return {
            restrict: 'E',
            scope: {
                initialValue: '=',
                onStateChangedEvent: '=onStateChanged',
                toolTipText: '=',
                labelText: '='
            },
            templateUrl: 'app/directives/bhtpSwitch/bhtpSwitch.html',
            controller: bhtpSwitchCtrl,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    bhtpSwitchCtrl.$inject = [];

    function bhtpSwitchCtrl() {
        var vm = this;

        vm.switchState = 'true';

        function init() {
            if (vm.initialValue === true) {
                vm.switchState = 'true';
            } else if (vm.initialValue === false) {
                vm.switchState = 'false';
            }
        };

        vm.handleStateChanged = function (newValue) {
            if (newValue == 'true') {
                vm.onStateChangedEvent(true);
            } else if (newValue == 'false') {
                vm.onStateChangedEvent(false);
            }
        };

        init();
    }
})();