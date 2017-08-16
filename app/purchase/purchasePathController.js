(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('purchasePathController', ['$q', '$stateParams', '$state', '$rootScope', '$window', 'customersService', 'portalService', purchasePathController]);

    function purchasePathController($q, $stateParams, $state, $rootScope, $window, customersService, portalService) {
        var vm = this;
        vm.params = $stateParams;
        vm.ratingId = $stateParams.ratingId;
        vm.step = $stateParams.page;
        vm.sessionId = $stateParams.sessionId;
        vm.quoteId = $stateParams.quoteId;
        vm.customer = null;
        vm.ready = false;

        vm.stepChanged = function (newStep) {
            // update the URL, but don't do a page refresh
            // this allows back button to work
            $state.go('purchaseBHTP',
                        {
                            ratingId: $stateParams.ratingId,
                            customerId: $stateParams.customerId,
                            quoteId: $stateParams.quoteId,
                            sessionId: $stateParams.sessionId,
                            page: newStep
                        },
                        { notify: false });
        }

        vm.packageChanged = function (newRatingId) {
            // update the URL, but don't do a page refresh
            // this allows back button to work
            $state.go('purchaseBHTP',
                        {
                            ratingId: newRatingId,
                            customerId: $stateParams.customerId,
                            quoteId: $stateParams.quoteId,
                            sessionId: $stateParams.sessionId,
                            page: $stateParams.page
                        },
                        { notify: false });
        }

        vm.purchaseCompleted = function (policyNumber) {
            $state.go('receiptBHTP',
                        {
                            policyNumber: policyNumber
                        });
        }

        function init() {
            var promises = [];
            if ($stateParams.customerId) {
                vm.customerId = $stateParams.customerId;
                promises.push(getCustomer());
            }

            // handle session id's, $stateParams.sessionId is null on refresh
            var sessionId = $stateParams.sessionId;
            if (sessionId) {
                $window.sessionStorage.setItem('sessionId', sessionId);
            } else {
                sessionId = $window.sessionStorage.getItem('sessionId');
                sessionId = sessionId ? sessionId : new Date().getTime();
            }

            vm.sessionId = sessionId;

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
        }

        function getCustomer() {
            return customersService.getById(vm.customerId).then(function (customer) {
                vm.customer = customer;
                if (customer) {
                    vm.customer.id = customer.customerId;

                    // maping fields that exist in the customer model being used in angular 2
                    if (customer.phoneNumbers && customer.phoneNumbers.length > 0) {
                        // the above call is using old middleware to get customer, currently only primary phone number
                        // is coming back if one exists so mapping first phone number in customers phone number list
                        vm.customer.phoneNumber = customer.phoneNumbers[0].phoneNumber;
                    }
                    vm.customer.email = customer.emailAddress;
                }
            }, function (err) {

            });
        }

        init();
    }

})();
