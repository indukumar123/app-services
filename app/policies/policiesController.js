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
        .controller('policiesController', ['$q', '$filter', '$stateParams', '$timeout', 'policiesService', 'settings', '$modal', 'utilService', 'portalService', 'agentService', policiesController]);

    function policiesController($q, $filter, $stateParams, $timeout, policiesService, settings, $modal, utilService, portalService, agentService) {
        var vm = this;
        vm.ready = false;
        vm.title = 'Policies';

        vm.products = [];
        vm.dateFilters = [];

        vm.filteredProduct = '';
        vm.filteredDate = 'All';
        vm.filteredStatus = '';
        vm.filteredSubmissionChannel = '';

        if ($stateParams.filter != null && $stateParams.filter.length > 0) {
            vm.filteredStatus = $stateParams.filter;
        }

        vm.agents = [];
        vm.refreshDataFlag = false;

        /**
         * @description
         * initialization, retrieves products, date filters and status lists
         */
        function init() {
            getDateFilters();
            getStatusList();
            getChannelList();

            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;

                if (vm.agent.isSuperUser) {
                    agentService.fetchAgents(agent.agencyId).then(function (results) {
                        if (results) {
                            vm.agents = results;
                        }
                    });
                }

                policiesService.loadAgencyProductsAndPackages(agent.agencyId).then(function (products) {
                    vm.products = products;
                });

                setGridColumns();
            });
        }

        /**
         * @description
         * set columns for grid
         */
        function setGridColumns()
        {
            if (vm.agent.isSuperUser) {
                vm.gridConfig = {
                    noDataMessage: "No policies found",
                    allowMultiSelect: false,
                    hasActions: true,
                    columns: [
                        { header: "Policy Id", binding: "policyNumber", href: 'policies/view/{{row.policyNumber}}', preferredWidth: '10%' },
                        { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '20%' },
                        { header: "Purchase Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Product", binding: "packageName", preferredWidth: '20%' },
                        { header: "Departure Date", binding: "departureDateForDisplay", filter: "date", filterBinding: "departureDates.localized.dateString", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Submission Channel", binding: "submissionChannel", preferredWidth: '1%' },
                        { header: "Agent Name", binding: "agentName", preferredWidth: '10%' },
                        { header: "Status", binding: "status", preferredWidth: '5%' }
                    ],
                    actionList: [
                        { label: "View", icon: "glyphicon-eye-open", href: 'policies/view/{{row.policyNumber}}' }
                    ],
                    defaultOrderBy: "departureDate.localDate",
                    defaultOrder: false,
                    rowIdentifier: "policyNumber",
                    filter: $filter("policiesFilterPurchaseDate")
                };
            }
            else {
                vm.gridConfig = {
                    noDataMessage: "No policies found",
                    allowMultiSelect: false,
                    hasActions: true,
                    columns: [
                        { header: "Policy Id", binding: "policyNumber", href: 'policies/view/{{row.policyNumber}}', preferredWidth: '10%' },
                        { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '20%' },
                        { header: "Purchase Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Product", binding: "packageName", preferredWidth: '20%' },
                        { header: "Departure Date", binding: "departureDateForDisplay", filter: "date", filterBinding: "departureDates.localized.dateString", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Submission Channel", binding: "submissionChannel", preferredWidth: '1%' },
                            { header: "Status", binding: "status", preferredWidth: '5%' }
                    ],
                    actionList: [
                        { label: "View", icon: "glyphicon-eye-open", href: 'policies/view/{{row.policyNumber}}' }
                    ],
                    defaultOrderBy: "departureDate.localDate",
                    defaultOrder: false,
                    rowIdentifier: "policyNumber",
                    filter: $filter("policiesFilterPurchaseDate")
                };
            }
            vm.ready = true;
        }

        /**
         * @description
         * gets list of status from the server
         */
        function getStatusList() {
            vm.statusList = policiesService.getStatusList();
        }

        function getChannelList()
        {
            vm.channelList = [
                { name: "All", value: "" },
                { name: "Agent", value: "Agent" },
                { name: "HA Merchant", value: "HA Merchant" },
                { name: "HA Non-Merchant", value: "HA Non-Merchant" },
                { name: "Mail", value: "Mail" },
                { name: "Mobile", value: "AgentMobile" },
                { name: "Phone In", value: "Phone In" },
                { name: "Web", value: "Web" }
            ];
        }
        /**
         * @description
         * gets date filters in form of time-ranges
         */
        function getDateFilters() {
            vm.dateFilters = policiesService.getDateFilters();
        }

        /**
         * @description
         * retrieves policies from the server
         */
        vm.loadData = function () {
            var dateRange = utilService.getDateRange(vm.filteredDate);

            var dateSelected;
            if (dateRange != null) {
                dateSelected = {
                    startDate: dateRange.startDate.format('MM/DD/YYYY'),
                    endDate: dateRange.endDate.format('MM/DD/YYYY')
                };
            }
            else {
                dateSelected = {
                    startDate: null,
                    endDate: null
                };
            }

            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
            });

            vm.gridConfig.dateSelected = dateSelected;

            var deferredPromise = $q.defer();
            policiesService.loadPagedData(vm.getCustomFilters()[3].value, vm.getCustomFilters()[0].value, vm.gridConfig.currentPage, vm.gridConfig.orderby, vm.gridConfig.reverse ? 'desc' : 'asc', dateSelected, "", vm.searchText, vm.getCustomFilters()[2].value, vm.getCustomFilters()[4].value).then(function (results) {
                vm.gridConfig.totalRecords = results.totalRecords;
                if (results.policies) {
                    for (var i = 0; i < results.policies.length; i++) {
                        var policy = results.policies[i];
                        if (policy.subTitle && policy.packageName.indexOf(' ') < 0) {
                            policy.packageName = policy.packageName + " " + policy.subTitle
                        }
                    }
                    results.policies.forEach(function (policy) {
                        policiesService.setPolicyActions(policy, vm.cancelPolicy, vm.agent.isAmbassador);
                    });
                    deferredPromise.resolve(results.policies);
                }
            }, function (error) {
                deferredPromise.reject(error);
            });
            return deferredPromise.promise;
        };

        /**
         * @description
         * custom filters required on policies grid
         */
        vm.getCustomFilters = function () {
            return [
                { key: "packageId", value: vm.filteredProduct },
                { key: "date", value: vm.filteredDate },
                { key: "status", value: vm.filteredStatus },
                { key: "agentId", value: vm.agent.isSuperUser ? (vm.filteredAgent ? vm.filteredAgent.agentId : null) : vm.agent.agentId },
                { key: "submissionChannel", value: vm.filteredSubmissionChannel }
            ];
        };

        /**
         * @description
         * grid implementation - for refreshing the grid's data
         */
        vm.refreshData = function () {
            vm.refreshDataFlag = true;
            vm.loadData();
        };
        /**
         * @description
         * grid implementation - for refreshing the grid's data
         */
        vm.reloadData = function () {
            vm.reloadDataFlag = true;
            vm.loadData();
        };

        /**
         * @description
         * grid implementation - filter-change event handling
         */
        vm.filterChanged = function () {
            vm.refreshData();
        };

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
        * grid implementation - reseting filter
        */
        vm.clearFilter = function () {
            vm.searchText = "";
            vm.refreshData();
        };
        

        /**
         * @description
         * grid implementation - cancel Policy
         */
        vm.cancelPolicy = function (actions) {
            var policy = actions.policyNumber;
            policiesService.confirmCancelPolicy(
                actions,
                function (result) {
                    vm.refreshData();
                    vm.reloadData();
                }
            );
        }

        init();
    }
})();