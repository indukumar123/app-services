(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name policiesController
     *
     * # policiesController
     *
     * @description
     * controller for policies listing on policies page
     */
    angular.module('agentPortal')
        .controller('policyEditController', ['$q', '$stateParams', '$rootScope', '$state', 'portalService', policyEditController]);

    function policyEditController($q, $stateParams, $rootScope, $state, portalService) {

        // Settings
        var vm = this;
        vm.policyNumber = null;

        /**
         * @description
         * initialization, retrieves policy
         */
        function init() {
            var promises = [];
            var policyNumber = $stateParams.policyNumber;
            vm.policyNumber = policyNumber;

            // taken from purchase path controller
            promises.push(portalService.getAgentByInternalId(null, false).then(function (agent) {
                vm.agent = agent;
            }));

            // get agent that was passed into the portal via url param (if there was one)
            if (portalService.getInternalAgentAuthId() !== null) {
                promises.push(portalService.getAgentByInternalId(null, true, true).then(function (overrideAgent) {
                    vm.overrideAgent = overrideAgent;
                }));
            }

            // hide angular 1 loading spinners
            $rootScope.$broadcast('hideOverlay');
            $q.all(promises).then(function () {
                // purchase path uses needs agent model
                vm.agent = vm.overrideAgent ? vm.overrideAgent : vm.agent;

                // adding address1 as street from the agent address - to match a more consistent address model in angular 2
                if (vm.agent.address) {
                    vm.agent.address.address1 = vm.agent.address.street;
                }

                vm.ready = true;
            });
        };

        vm.navigateToPolicyDetails = function (policyNumber) {
            if (policyNumber) {
                $state.go('policiesView', { policyNumber: policyNumber });
            }
        };

        vm.editCompleted = function (policyNumber) {
            if (policyNumber) {
                $state.go('receiptBHTP', { policyNumber: policyNumber });
            }
        };

        init();
    }
})();