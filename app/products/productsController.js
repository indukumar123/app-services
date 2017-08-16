(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name productsController
     *
     * # productsController
     *
     * @description
     * controller for products page, allows picking the product and routing the user to purchase the product
     */
    angular.module('agentPortal')
        .controller('productsController', ['$stateParams', 'portalService', 'productService', 'utilService', '$q', 'purchaseNavigationService', productsController]);

    function productsController($stateParams, portalService, productService, utilService, $q, purchaseNavigationService) {

        var vm = this;

        vm.productHeader = null;
        vm.packages = null;
        vm.customerId = null;

        if ($stateParams.customerId != null && $stateParams.customerId.length > 0) {
            vm.customerId = $stateParams.customerId;
        }

        vm.init = function () {
            var promises = [];

            // TODO get the packages for an agent passed in
            promises.push(portalService.getAgentByInternalId(null, true, false).then(function (agent) {
                vm.agent = agent;
                return portalService.loadStatesForAgent(agent.agentId).then(function (response) {
                    vm.agent.states = response.states;
                });
            }));

            promises.push(portalService.loadProductsAndPackages().then(function (response) {
                vm.products = response.products;
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                vm.productHeader = productService.getProductsHeader();
                vm.packages.forEach(function (pakage) {
                    pakage.coverageDescriptions = [];
                    pakage.optionalCoverageDescriptions = [];
                    pakage.hasDetails = false;

                    // looping through all states
                    for (var s = 0; s < vm.agent.states.length; s++) {
                        // Looping through all products
                        for (var p = 0; p < vm.agent.states[s].products.length; p++) {
                            if (vm.agent.states[s].products[p].productId == pakage.productId) {
                                // Looping through all packages
                                for (var pa = 0; pa < vm.agent.states[s].products[p].packages.length; pa++) {
                                    if (vm.agent.states[s].products[p].packages[pa].id == pakage.id && vm.agent.states[s].products[p].packages[pa].canSell) {
                                        pakage.canSell = true;
                                        break;
                                    }
                                }
                            }
                            if (pakage.canSell) { break; }
                        }
                        if (pakage.canSell) { break; }
                    }

                    productService.getCoverages(pakage.name).$promise.then(function (coverageDescriptions) {
                        coverageDescriptions.forEach(function (coverageDescription) {
                            coverageDescription.feature = coverageDescription.title;
                            coverageDescription.benefit = coverageDescription.content.split("|")[0];
                            coverageDescription.detail = coverageDescription.content.split("|")[1];
                            if (coverageDescription.detail != null && coverageDescription.detail.length > 0) {
                                pakage.hasDetails = true;
                            }
                            if (coverageDescription.type.indexOf('OptionalCoverage') == -1) {
                                pakage.coverageDescriptions.push(coverageDescription);
                            } else {
                                pakage.optionalCoverageDescriptions.push(coverageDescription);
                            }
                        });
                    }, function (error) {
                        console.warn("Failed while retrieving product coverages %o", error);
                        utilService.showPopup("Error", "Failed to retrieve information about products.");
                    });

                });
            });
        };

        /**
         * @description
         * re-route the user to purchase path upon selection of the product 
         */
        vm.selectPackage = function (pkg) {
            purchaseNavigationService.navigateToPurchase(pkg, vm.customerId, null, null);
        };

        vm.init();
    }

})();
