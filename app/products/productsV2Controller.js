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
        .controller('productsV2Controller', ['portalService', '$stateParams', 'productService', 'utilService', 'statePersister', 'customersService', 'format', 'storage', 'purchaseNavigationService', productsController]);



    function productsController(portalService, $stateParams, productService, utilService, statePersister, customersService, formatService, storage, purchaseNavigationService) {

        var vm = this;
        vm.isLoading = true;
        vm.hideState = false;
        var distinctSubcategories = [];

        vm.distinctCategories = [{
            categoryLabel: "Trip Cancellation / Interruption",
            categoryId: 0,
            links: ["Trip", "Accidental Death/Dismemberment", "Baggage", "Missed Connection"]
        }, {
            categoryLabel: "Medical & Emergency Coverage",
            categoryId: 1,
            links: ["Medical"]
        }, {
            categoryLabel: "Optional Coverage",
            categoryId: 2,
            links: ["Car Rental"]
        }];

        vm.productHeader = null;
        vm.packages = null;
        vm.customerId = null;
        vm.state = statePersister.retrieve();
        vm.aircareV2Active = global_aircare_v2_active;
        vm.agentGuideLink = null;

        /**
         * @description
         * re-route the user to purchase path upon selection of the product 
         */
        vm.selectPackage = function (pkg) {
            purchaseNavigationService.navigateToPurchase(pkg, vm.customerId, null, null);
        };

        /*
         * @description
         * getting the subcategories filtered out by category and sorted my name
         */
        vm.getFilteredSubcategories = function (categoryId) {
            var returnedSubcategories = [];

            if (distinctSubcategories.length > 0) {

                // Trip Cancellation / Interruption Category
                if (categoryId == 0) {
                    returnedSubcategories = distinctSubcategories.filter(function (subcategoryItem) {
                        return (subcategoryItem.type.toLowerCase() == 'standard' || subcategoryItem.type.toLowerCase() == 'extra') && subcategoryItem.coverageGroup != 'Medical';
                    });
                }

                    // Medical & Emergency Coverage Category
                else if (categoryId == 1) {
                    returnedSubcategories = distinctSubcategories.filter(function (subcategoryItem) {
                        return subcategoryItem.coverageGroup == 'Medical';
                    });
                }

                    // Optional Coverage Category
                else if (categoryId == 2) {
                    returnedSubcategories = distinctSubcategories.filter(function (subcategoryItem) {
                        return subcategoryItem.type.toLowerCase() == 'optional' || subcategoryItem.type.toLowerCase() == 'upgrade';// || subcategoryItem.subcategory.toLowerCase() == 'cancel for any reason';
                    });
                }

                // Sort subcategories by name
                returnedSubcategories.sort(function (a, b) {
                    var nameA = a.subcategory.toLowerCase(), nameB = b.subcategory.toLowerCase();

                    if (nameA < nameB)
                        return -1;

                    if (nameA > nameB)
                        return 1;

                    return 0;
                });

                // return data
                return returnedSubcategories;
            }
        };


        /*
         * @description
         * get the coverage data to insert into the matrix field
         */
        vm.getMatrixItem = function (subcategory, packageId) {

            // default display text if no coverage
            var returnValue = "-";

            // keep the working package in context 
            var workingPackage = vm.packages.filter(function (p) {
                return p.id == packageId;
            })[0];

            // get coverage information that matches the filter criteria
            var workingCoverageArray = workingPackage.coverages.filter(function (c) {
                return c.category == subcategory && (c.type == 'Standard' || c.type == 'Extra');
            });

            // get other, unhandled coverages based on the subcategory name
            if (subcategory.toLowerCase() == 'medical expense' || subcategory.toLowerCase() == 'cancel for any reason' || subcategory.toLowerCase() == 'car rental collision coverage') {
                workingCoverageArray = workingPackage.coverages.filter(function (c) {
                    return c.category == subcategory && (c.type !== 'Standard');
                });
            }

            // format data and return
            if (workingCoverageArray.length == 0) {
                return returnValue;
            }
            else {
                return formatService.formatCoverageLimits(workingCoverageArray[0]);
            }
        }


        /*
         * @description
         * Convert the availbalility code into client text
         */
        vm.convertAvailability = function (availability) {
            switch (availability) {
                case 'Both':
                    return 'International & Domestic';
                case 'International':
                    return 'International';
                case 'Domestic':
                    return 'Domestic';
                default:
                    return null;
            }
        }

        /*
         * @description
         * state selector change handler
         */
        vm.stateChanged = function () {
            organizeData();
        }

        /*
         * @description
         * Sort packages alphabetically
         */
        function sortPackages() {
            vm.packages.sort(function (a, b) {
                var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase()

                if (nameA < nameB)
                    return -1;

                if (nameA > nameB)
                    return 1;

                return 0;
            });
        }

        /*
         * @description
         * Go through all package coverages to find the row distinct 
         * set of titles for coverage comparison rows
         */
        function getDistnictCategoriesAndSubcategories() {
            // Loop through packages
            for (var i = 0; i < vm.packages.length; i++) {

                // find included coverages for the package
                var includedCoverages = vm.packages[i].coverages.filter(function (f) {
                    return f.type == 'Standard' || f.type == 'Extra';
                });

                // filter coverages putting included coverage categories on top of distinctSubcategories
                for (var c = 0; c < includedCoverages.length; c++) {

                    // Get distinct included coverage categories
                    var distinctIncludedCategories = distinctSubcategories.filter(function (subcategoryItem) {
                        return (subcategoryItem.subcategory == includedCoverages[c].category && subcategoryItem.type == includedCoverages[c].type);
                    });

                    //Add only if coverage dont exist in distinct included groups from another package iteration
                    if (distinctIncludedCategories.length == 0) {
                        distinctSubcategories.push({
                            subcategory: includedCoverages[c].category,
                            coverageGroup: includedCoverages[c].coverageGroup,
                            type: includedCoverages[c].type
                        });
                    }
                }

                // Sort coverages putting optional at the bottom
                for (var c = 0; c < vm.packages[i].coverages.length; c++) {

                    // Get distinct optional coverage categories
                    var distinctOptionalCategories = distinctSubcategories.filter(function (subcategoryItem) {
                        return subcategoryItem.subcategory == vm.packages[i].coverages[c].category;
                    });

                    //Add only if coverage dont exist in distinct optional groups from another package iteration
                    if (distinctOptionalCategories.length == 0) {
                        distinctSubcategories.push({
                            subcategory: vm.packages[i].coverages[c].category,
                            coverageGroup: vm.packages[i].coverages[c].coverageGroup,
                            type: vm.packages[i].coverages[c].type
                        });
                    }
                }
            }
        }


        /*
         * @description
         * main initialization function
         */
        function init() {

            portalService.loadStates().then(function (response) {
                vm.states = response.states;
                if ($stateParams.customerId != null && $stateParams.customerId.length > 0) {
                    vm.hideState = true;
                    vm.customerId = $stateParams.customerId;
                    customersService.getById(vm.customerId).then(function (customerData) {
                        vm.state = customerData.address.stateOrProvince;
                        organizeData();
                    });
                }
                else {
                    var isCustomSession = (window.sessionStorage.getItem("isCustomSession") == 'true');

                    if (isCustomSession) {
                        vm.hideState = true;
                        /*
                        $("#sidebar").hide();
                        $("#bs-example-navbar-collapse-1").hide();
                        */
                        var customSession = JSON.parse(window.sessionStorage.getItem('customSession'));
                        vm.state = customSession.billToAddress.stateOrProvince;
                        vm.hideState = false;
                    }

                    if (vm.state != null) {
                        organizeData();
                    }
                }

                setAgentGuideLink();
            })
        };

        /*
         * @description
         * state selector change handler
         */
        function organizeData() {
            if (vm.state == null || vm.state == "") {
                return;
            }
            vm.isLoading = true;

            getAgent()
                .then(getPackagesForAgentByState, handleError)
                .then(filterFullPackagesByState, handleError);

            function handleError(error) {
                console.error("Failed to load packages");
                console.error(error);
            }

            function getAgent() {
                var promise = null;

                if (vm.agent) {
                    promise = new Promise(function (resolve, reject) {
                        resolve(vm.agent);
                    });
                }
                else {
                    promise = portalService.getAgentByInternalId(null, true, false)
                        .then(function (agent) {
                            vm.agent = agent;
                        });
                }

                return promise;
            }

            function getPackagesForAgentByState(agent) {
                var promise = new Promise(function (resolve, reject) {
                        if (vm.statePackagesForAgent) {
                            resolvePromise(vm.statePackagesForAgent);
                        }
                        else {
                            portalService.loadPackagesForAgentByState(vm.agent.agentCode)
                                .then(function (response) {
                                    if (response && response.states) {
                                        vm.statePackagesForAgent = response.states;
                                        resolvePromise(vm.statePackagesForAgent);
                                    }
                                });
                        }

                        function resolvePromise(packages) {
                            var filteredPackages = filterPackageByState(vm.statePackagesForAgent);
                            resolve(filteredPackages);
                        }
                });

                return promise;
            }

            // Accept a packages by state object and returns the packages for the current state
            // that are eligible for sale based on agreements and product availability
            function filterPackageByState(packagesByState) {
                var packages = [];

                if (packagesByState && packagesByState.length > 0) {
                    for (var i = 0; i < packagesByState.length; i++) {
                        var currentState = packagesByState[i];
                        if (currentState.iso2Code === vm.state) {
                            vm.stateName = currentState.state;
                            for (var j = 0; j < currentState.packages.length; j++) {
                                var pkg = currentState.packages[j];

                                if (pkg.canSell && pkg.hasAgreement && portalService.isPackageAvailable(pkg)) {
                                    packages.push(pkg);
                                }
                            }

                            break;
                        }
                    }
                }

                return packages;
            }

            // Accepts a list of packages that are available for the state and returns
            // the full package data for each state
            function filterFullPackagesByState(filteredStatePackages) {
                if (vm.agent && filteredStatePackages) {
                    return productService.getPackageByState(vm.state, vm.agent)
                        .then(function (newPackages) {
                            vm.packages = [];
                            if (newPackages && newPackages.result) {
                                var fullPackageList = newPackages.result;
                                for (var i = 0; i < fullPackageList.length; i++) {
                                    var fullPackage = fullPackageList[i];
                                    var statePackage = filteredStatePackages.find(function (pkg) { return pkg.ratingId === fullPackage.ratingId; });

                                    if (statePackage) {
                                        vm.packages.push(fullPackage);
                                    }
                                }
                            }
                        });
                }
            }
        }

        /*
         * @description
         * state selector change handler
         */
        function setAgentGuideLink() {
            if (vm.aircareV2Active) {
                vm.agentGuideLink = "/Content/pdf/AgentGuideSummaryV2.pdf";
            } else {
                vm.agentGuideLink = "/Content/pdf/AgentGuideSummary.pdf";
            }
        }

        // Start process
        init();
    }

})();
