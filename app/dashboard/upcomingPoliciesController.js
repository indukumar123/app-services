(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name upcomingPoliciesController
     *
     * # upcomingPoliciesController
     *
     * @description
     * controller to coordinate action for upcoming policies on the dashboard page
     */
    angular.module('agentPortal')
        .controller('upcomingPoliciesController', ['$q', 'policiesService', '$rootScope', 'settings', 'portalService', upcomingPoliciesController]);

    function upcomingPoliciesController($q, policiesService, $rootScope, settings, portalService) {
        var vm = this;

        vm.title = 'Upcoming Policies';
        vm.reloadDataFlag = false;
        vm.refreshDataFlag = false;
        vm.ready = false;

        /**
         * @description
         * reloads upcoming policies from the server
         */
        vm.reloadData = function () {
            vm.reloadDataFlag = true;
        };
        /**
         * @description
         * refresh upcoming policies from the server
         */
        vm.refreshData = function () {
            vm.refreshDataFlag = true;
        };

        function init() {
            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
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
                        defaultOrderBy: "departureDates.localized.dateString",
                        defaultOrder: false,
                        rowIdentifier: "policyNumber",
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
                        defaultOrderBy: "departureDates.localized.dateString",
                        defaultOrder: false,
                        rowIdentifier: "policyNumber",
                    };
                }

                vm.ready = true;
            })
        }

        /**
         * @description
         * loads active policies from the server
         */
        vm.loadData = function () {
            if (vm.agent.isSuperUser)
            {
                var dateSelected = {
                    startDate: null,
                    endDate: null
                };

                var deferredPromise = $q.defer();
                policiesService.loadPagedData(vm.agent.agentId, "", vm.gridConfig.currentPage, vm.gridConfig.orderby, vm.gridConfig.reverse ? 'desc' : 'asc', dateSelected,"", "" ,'Active').then(function (results) {
                    vm.gridConfig.totalRecords = results.totalRecords;
                    if (results.policies) {
                        for (var i = 0; i < results.policies.length; i++) {
                            var policy = results.policies[i];
                            if (policy.subTitle && policy.packageName.indexOf(' ') < 0) {
                                policy.packageName = policy.packageName + " " + policy.subTitle
                            }
                        }
                        results.policies.forEach(function (policy) {
                            policiesService.setPolicyActions(policy, vm.cancelPolicy);
                        });
                        deferredPromise.resolve(results.policies);
                    }
                }, function (error) {
                    deferredPromise.reject(error);
                });
                return deferredPromise.promise;
            }
            else {
                var deferredPromise = $q.defer();
                policiesService.loadData('Active').then(function (results) {
                    results.forEach(function (policy) {
                        if (policy.subTitle && policy.packageName.indexOf(' ') < 0) {
                            policy.packageName = policy.packageName + " " + policy.subTitle
                        }
                        policiesService.setPolicyActions(policy, vm.cancelPolicy, vm.agent.isAmbassador);
                    });
                    deferredPromise.resolve(results);

                }, function (error) {
                    deferredPromise.reject(error);
                });

                return deferredPromise.promise;
            }
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
        };

        init();
    }
})();