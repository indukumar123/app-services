(function() {
    'use strict';

    /**
     * @ngdoc controller
     * @name customersController
     *
     * # customersController
     *
     * @description
     * provides functions to support customers page
     */
    angular.module('agentPortal')
        .controller('customersController', ['$q', '$filter', 'customersService', 'agentService', 'settings', 'utilService', '$timeout', 'portalService', 'storage', customersController]);


    function customersController($q, $filter, customersService, agentService, settings, utilService, $timeout, portalService, storage) {
        var vm = this;

        vm.title = 'Customers';

        vm.products = [];
        vm.dateFilters = [];

        vm.filteredProduct = '';
        vm.filteredDate = 'All';
        vm.filteredAgent = null;

        vm.refreshDataFlag = false;
        vm.ready = false;

        vm.agent = {};
        vm.agents = [];

        /**
         * @description
         * initialization, primarily date filters
         */
        function init() {
            getDateFilters();
            //hide the customer search in the case of purchase....
            storage.set("showCustomerSearchLink", false);
            storage.set("updateCustomerMessage", false);
            var promises = [];

            promises.push(portalService.getAgentByInternalId(null, false).then(function (agent) {
                vm.agent = agent;
                
                var innerPromises = [];

                if (vm.agent.isSuperUser) {
                    innerPromises.push(agentService.fetchAgents(agent.agencyId).then(function (results) {
                        if (results) {
                            vm.agents = results;
                        }
                    }));
                }

                innerPromises.push(portalService.loadPackagesForAgentByState(vm.agent.agentCode).then(function (response) {
                    vm.agent.states = response.states;
                }));

                return $q.all(innerPromises);
            }));

            // get agent that gets passed in
            if (portalService.getInternalAgentAuthId() !== null) {
                promises.push(portalService.getAgentByInternalId(null, true, true).then(function (overrideAgent) {
                    vm.overrideAgent = overrideAgent;
                    return portalService.loadPackagesForAgentByState(vm.overrideAgent.agentCode).then(function (response) {
                        vm.overrideAgent.states = response.states;
                    });
                }));
            }

            promises.push(portalService.loadProductsAndPackages().then(function (response) {
                vm.products = response.products;
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                vm.gridConfig = {
                    noDataMessage: "No customers found",
                    allowMultiSelect: false,
                    hasActions: true,
                    columns: [
                        { header: "Name", binding: "name", href: 'customers/edit/{{row.customerId}}' },
                        { header: "Date of Birth", binding: "dob", filter: "date", filterParam: settings.date.format },
                        { header: "Email", binding: "email" },
                        { header: "Primary Phone", binding: "phone", filter: "phoneNumber" },
                        { header: "State", binding: "state" },
                        { header: "Last Purchase", binding: "lastPurchaseDate", filter: "date", filterParam: settings.date.format }
                    ],
                    actionList: [
                        { label: "View", icon: "glyphicon-eye-open", href: 'customers/edit/{{row.customerId}}' }
                    ],
                    defaultOrderBy: "name",
                    defaultOrder: false,
                    rowIdentifier: "customerId",
                    filter: $filter("customersFilter"),
                    agencyId: vm.agent.agencyId
                };

                vm.ready = true;
            });
        };

        function getDateFilters() {
            vm.dateFilters = customersService.getDateFilters();
        }

        /**
         * @description
         * sets actions for customers grid's rows 
         */
        function setCustomerActions(customer, states) {
            customer.actions = [];
            var customerState = states[customer.state];
            if (!customerState)
                return;

            var packages = customerState.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
            packages.forEach(function (selectedpackage) {
                if (selectedpackage && selectedpackage.canSell) {
                    //Add Action only if customer can purchase
                    customer.actions.push({
                        icon: "glyphicon-send",
                        // disabled: !pack.canSell, // Do not disable packages anymore as a result of US4681 - Licese Validation
                        title: selectedpackage.title,
                        label: "Add {package}"
                                    .replace("{package}", selectedpackage.name),
                        href: "purchase/package/:ratingId/customer/:customerId/"
                                    .replace(":customerId", customer.customerId)
                                    .replace(":ratingId", selectedpackage.ratingId)
                    });
                }
            });
            // Set up the remove functionality
            if (!vm.agent.isAmbassador && customer.lastPurchaseDate == null) {
                customer.actions.push({ label: "Remove", click: vm.removeCustomer, icon: "glyphicon-trash", href: "#" });
            }
        };

         /**
         * @description
         * Removes Customer from views
         */
        vm.removeCustomer = function (customer) {
            customersService.removeCustomer(customer.customerId, 'customers', customer.firstName, customer.lastName, vm.refreshData);
        };

        /**
         * @description
         * loads customers from the server
         */
        vm.loadData = function () {
            if (vm.agent.isSuperUser) {
                var dateRange = utilService.getDateRange(vm.filteredDate);

                var dateSelected;
                if (dateRange != null) {
                    dateSelected = {
                        startDate: dateRange.startDate.format('MM/DD/YYYY'),
                        endDate: dateRange.endDate.format('MM/DD/YYYY')
                    }
                }
                else {
                    dateSelected = {
                        startDate: null,
                        endDate: null
                    }
                }
                vm.gridConfig.dateSelected = dateSelected;
                var deferredPromise = $q.defer();
                customersService.loadPagedData(vm.getAgentId(), null, vm.gridConfig.currentPage, vm.gridConfig.orderby, vm.gridConfig.reverse ? 'desc': 'asc', dateSelected, vm.searchText).then(function (results) {
                    vm.gridConfig.totalRecords = results.totalRecords;
                    results.customers.forEach(function (customer) {
                        setCustomerActions(customer, agentService.getStatePackages(vm.overrideAgent && vm.overrideAgent.states ? vm.overrideAgent.states : vm.agent.states));
                    });
                    deferredPromise.resolve(results.customers);

                }, function (error) {
                    deferredPromise.reject(error);
                });
                return deferredPromise.promise;
            }
            else {
                var deferredPromise = $q.defer();
                customersService.loadData().then(function (results) {
                    results.forEach(function (customer) {
                        setCustomerActions(customer, agentService.getStatePackages(vm.overrideAgent && vm.overrideAgent.states ? vm.overrideAgent.states : vm.agent.states));
                    });
                    deferredPromise.resolve(results);

                }, function (error) {
                    deferredPromise.reject(error);
                });
                return deferredPromise.promise;
            }
        };

        vm.getCustomFilters = function() {
            return [
                { key: "date", value: vm.filteredDate },
                { key: "agentId", value: vm.agent.isSuperUser ? (vm.filteredAgent ? vm.filteredAgent.agentId : null) : vm.agent.agentId }
            ];
        }

        var timeout;
        vm.searchChanged = function () {
            if (vm.agent.isSuperUser) {
                if (vm.timer) {
                    $timeout.cancel(vm.timer);
                }
                vm.timer = $timeout(function () {
                    vm.filterChanged();
                }, global_echo_timeout);
            }
            else {
                vm.filterChanged();
            }
        }
        /**
         * @description
         * grid refresh implementation
         */
        vm.refreshData = function() {
            vm.refreshDataFlag = true;
        };

        /**
         * @description
         * grid implementation to detect change of filter, basically invokes refreshData
         */
        vm.filterChanged = function () {
            vm.refreshData();
        };

        /**
         * @description
         * grid implementation for reseting the filters
         */
        vm.clearFilter = function() {
            vm.searchText = "";
            vm.refreshData();
        };

        /**
         * @description
         * get agent id
         */
        vm.getAgentId = function () {
            return vm.agent.isSuperUser ? (vm.filteredAgent ? vm.filteredAgent.agentId : null) : vm.agent.agentId;
        };

        init();
    };
})();