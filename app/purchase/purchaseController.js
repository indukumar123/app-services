(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('purchaseController', ['$q', '$stateParams', 'portalService', '$state', 'quotes', 'dataservice', 'customersService', 'productRatingIds', 'partnerCustomerService', purchaseController]);

    function purchaseController($q, $stateParams, portalService, $state, quotes, dataservice, customersService, productRatingIds, partnerCustomerService) {

        var vm = this;

        vm.ratingId = null;
        vm.package = null;
        vm.packages = null;

        vm.aircareRatingIds = [];
        vm.traditionalRatingIds = [];
        vm.agentPackages = [];

        vm.agent = {};

        if ($stateParams.ratingId != null && $stateParams.ratingId.length > 0) {
            vm.ratingId = $stateParams.ratingId;
        }

        vm.init = function () {
            var promises = [];

            // TODO get the packages for an agent passed in
            promises.push(portalService.getAgentByInternalId(null, true, false).then(function (agent) {
                vm.agent = agent;

                var innerPromises = [];
                innerPromises.push(portalService.loadPackagesForAgentApi(agent.agentCode).then(function (response) {
                    vm.packages = response.packages;
                }));

                return $q.all(innerPromises);
            }));

            $q.all(promises).then(function () {
                // if the package id isn't null, search for a package
                searchPackages();

                redirectWithPackage();
            });
        };

        vm.init();

        function searchPackages() {
            for (var i = 0; i < vm.packages.length; i++) {
                if (vm.ratingId != null && vm.ratingId == vm.packages[i].ratingId) {
                    vm.package = vm.packages[i];
                    break;
                }
            }
        }

        function redirectToPartnerQuote(currentPackage) {
            quotes.setCurrentPackage(currentPackage);
            $state.go('quote', { packageName: currentPackage.alias.toLowerCase().replace(/ /g, '') });
        }

        function redirectToPartnerWithQuote(currentPackage, quoteNumber) {
            quotes.setCurrentPackage(currentPackage);
            $state.go('loadQuote', { packageName: currentPackage.alias.toLowerCase().replace(/ /g, ''), quoteNumber: quoteNumber });
        }

        function redirectWithPackage() {
            if (vm.package != null) {
                var currentPackage = vm.package;
                
                if (currentPackage.productRatingId === productRatingIds.vacationGuard) {
                    currentPackage.packageName = currentPackage.alias;
                    // Set partner package to true until the api is updated to return this
                    currentPackage.partnerPackage = true

                    // grab the customer data if there is any and store it in the customer service
                    if ($stateParams.customerId != null && $stateParams.customerId.length > 0) {
                        customersService.getById($stateParams.customerId).then(function (customerData) {
                            partnerCustomerService.setCustomer(customerData);
                            redirectToPartnerQuote(currentPackage);
                        })
                            .catch(function (error) {
                                partnerCustomerService.setCustomer(null);
                                redirectToPartnerQuote(currentPackage);
                            });
                    } else if ($stateParams.quoteId) {
                        partnerCustomerService.setCustomer(null);
                        redirectToPartnerWithQuote(currentPackage, $stateParams.quoteId);
                    } else {
                        partnerCustomerService.setCustomer(null);
                        redirectToPartnerQuote(currentPackage);
                    }
                } else {
                    $state.go('purchaseBHTP',
                        {
                            ratingId: currentPackage.ratingId,
                            customerId: $stateParams.customerId,
                            quoteId: $stateParams.quoteId,
                            sessionId: $stateParams.sessionId ? $stateParams.sessionId : new Date().getTime()
                        });
                }
            }
        }
    }

})();
