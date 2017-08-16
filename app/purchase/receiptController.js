(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('receiptController', ['$stateParams', '$state', receiptController]);

    function receiptController($stateParams, $state) {
        var vm = this;
        vm.ready = false;

        function init() {
            vm.policyNumber = $stateParams.policyNumber;
            vm.ready = true;
        }

        vm.viewPolicy = function (policyNumber) {
            $state.go('policiesView',
                        {
                            policyNumber: policyNumber
                        });
        }

        vm.editPolicy = function (policyNumber) {
            $state.go('policiesEdit',
                        {
                            policyNumber: policyNumber
                        });
        }

        init();
    }

})();
