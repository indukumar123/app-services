(function() {
    'use strict';

    /**
     * @ngdoc controller
     * @name kpiController
     *
     * # kpiController
     *
     * @description
     * controller for displaying KPI tiles on the dashboard
     */
    angular.module('agentPortal')
        .controller('kpiController', ['$scope', 'settings', '$state', '$filter', 'kpiServices', 'utilService', 'portalService', 'agentService', kpiController]);

    function kpiController($scope, settings, $state, $filter, kpiServices, utilService, portalService, agentService) {
        var vm = this;
        var dateFormat = 'MM-DD-YYYY';

        vm.dateRangeInvalid = false;

        vm.message = null;

        vm.agent = {};
        vm.agents = [];

        vm.dateFilter = {
            fromDate: null,
            toDate: null,
            fromDateDatePicker: false,
            toDateDatePicker: true
        };

        //watch date filters and refresh KPIs if they change
        //$scope.$watch('dateFilter.fromDate', function () { refreshKpis(); });

        //watch date filters and refresh KPIs if they change
        //$scope.$watch('dateFilter.toDate', function () { refreshKpis(); });

        /**
         * @description
         * validates the date range selected by the user
         */
        function validateDateRange() {

            vm.dateRangeInvalid = false;

            if (vm.dateFilter.fromDate != null && vm.dateFilter.toDate != null) {

                var fromDate = moment(vm.dateFilter.fromDate);

                var toDate = moment(vm.dateFilter.toDate);

                vm.dateRangeInvalid = (fromDate.diff(toDate, 'days') > 0);

                return !vm.dateRangeInvalid;
            }

            return true;

        }

        //date mask for date fields
        vm.dateMask = settings.masks.date;
        vm.datePlaceholder = settings.date.displayFormat;

        //range options for date/timespan filters
        vm.rangeOptions = [
            {
                period: 'Today',
                value: '0'
            },
            {
                period: 'This Week',
                value: '1'
            },
            {
                period: 'This Month',
                value: '2'
            },
            {
                period: 'Previous Month',
                value: '3'
            },
            {
                period: 'YTD',
                value: '4'
            },
            {
                period: 'Custom Date Range',
                value: '5'
            }
        ];

        /**
         * @description
         * opens up date-picker for date related fields
         */
        vm.openDatePicker = function ($event, sourceObject, attribute) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.dateFilter.fromDateDatePicker = false;
            vm.dateFilter.toDateDatePicker = false;
            sourceObject[attribute] = true;
        };

        /**
         * @description
         * refreshes kpis for custom date fields
         */
        vm.dateChanged = function () {
            if (vm.dateFilter.fromDate && vm.dateFilter.toDate) {
                refreshKpis();
            }
        }

        vm.selectedRange = '';
        vm.ytd = null;
        vm.policiesSold = null;
        vm.quotes = null;
        vm.commission = null;

        /**
         * @description
         * navigates to the active policies page - now not needed
         */
        vm.goToActivePoliciesPage = function () {
            $state.go('policiesFilter', { filter: 'Active' });
        };

        /**
         * @description
         * refreshes KPIs when date-range changes
         */
        $scope.$watch('vm.selectedRange', function (newValue) {
            if (!newValue) return;
            refreshKpis();
        });

        /**
         * @description
         * actual refresh KPIs implementation
         */
        function refreshKpis() {
            vm.message = null;
            if (vm.selectedRange == null) return;
            var data = vm.selectedRange.value;
            
            var fromDate = null;
            var toDate = null;
            var now = moment();

            //set time-range based on the time-span selected
            switch (data) {
                case "0":
                    toDate = now;
                    fromDate = toDate;
                    break;
                case "1":
                    toDate = now.clone();
                    fromDate = now.subtract(toDate.format("E")-1, 'days');
                    break;
                case "2":
                    toDate = now.clone();
                    fromDate = now.subtract(toDate.format("D") - 1, 'days');
                    break;
                case "3":
                    toDate = now.subtract(now.format("D"), 'days');
                    fromDate = toDate.clone().subtract(toDate.format("D") - 1, 'days');
                    break;
                case "4":
                    toDate = now.clone();
                    fromDate = now.subtract(now.format("DDD")-1, 'days');
                    break;
                case "5":
                    if (vm.dateFilter.fromDate != null && vm.dateFilter.toDate != null && validateDateRange()) {
                        fromDate = moment(vm.dateFilter.fromDate);
                        toDate = moment(vm.dateFilter.toDate);
                    }
                    break;
                default: break;
            }


            if (fromDate != null && toDate != null) {
                var fromDateAsString = fromDate.format(dateFormat);
                var toDateAsString = toDate.format(dateFormat);

                vm.message = ("From " + fromDateAsString + " to " + toDateAsString).replace(/-/g, "/");
                loadKpis(fromDateAsString, toDateAsString);
            }
        }

        /**
         * @description
         * sets scope variables to display tiles information
         */
        function setScopeDataForTiles(itemsArray) {
            vm.loading = false;
            if (itemsArray && itemsArray) {
                for (var i = 0; i < itemsArray.length; i++) {
                    var el = itemsArray[i];
                    switch (el.key) {
                        case 'Sales YTD':
                            vm.ytd = el.value;
                            break;
                        case 'Policies Sold':
                            vm.policiesSold = el.value;
                            break;
                        case 'Saved Quotes':
                            vm.quotes = el.value;
                            break;
                        case 'Commission':
                            vm.commission = el.value;
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        /**
       * @description
       * get selected agent matrics
       */
        vm.getAgentMetrics = function () {
             refreshKpis();
        }

        /**
         * @description
         * loads KPIs for given date range
         */
        function loadKpis(fromdate, toDate) {

            vm.selectedAgent = vm.selectedAgent === null ? {} : vm.selectedAgent;
            vm.loading = true;

            if (vm.agent.isSuperUser && (vm.selectedAgent.agentId == undefined || vm.selectedAgent.agentId == null)) {
                // super user and no agent selected
                kpiServices
                .getKpisAgency(fromdate, toDate)
                .then(setScopeDataForTiles, function (error) {
                    vm.loading = false;
                    console.warn("Failed to retrieve KPIs %o", error);
                    utilService.showPopup("Error", "Failed to retrieve the metrics.");
                });
            }
            else {
                // Not dependent on super user now
                kpiServices
                .getKpisCustomAgent(fromdate, toDate, vm.agent.isSuperUser ? vm.selectedAgent.agentId : vm.agent.agentId)
                .then(setScopeDataForTiles, function (error) {
                    vm.loading = false;
                    console.warn("Failed to retrieve KPIs %o", error);
                    utilService.showPopup("Error", "Failed to retrieve the metrics.");
                });
            }
            
        }

        function activate() {
            portalService.getAgentByInternalId(null, false).then(function (agent) {
                vm.agent = agent;
                vm.selectedRange = vm.rangeOptions[2];
                vm.selectedAgent = {};
                if (vm.agent.isSuperUser) {
                    return agentService.fetchAgents(agent.agencyId).then(function (results) {
                        if (results) {
                            vm.agents = results;
                        }
                    });
                }
            });
        }

        activate();
    }
})();