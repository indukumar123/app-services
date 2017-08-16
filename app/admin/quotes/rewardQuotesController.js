(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name manageAgentsController
     *
     * # manageAgentsController
     *
     * @description
     * controller for agents listing on manage agents page
     */
    angular.module('agentPortal')
        .controller('rewardQuotesController', rewardQuotesController);

    rewardQuotesController.$inject = ['portalService', 'quotesService', '$state', 'agents', 'settings', '$q'];

    function rewardQuotesController(portalService, quotesService, $state, agents, settings, $q) {
        var vm = this;
        vm.title = 'Verify Points';
        vm.searchText = null;
        vm.filteredStatus = '';
        vm.refreshDataFlag = false;
        vm.ready = false;
        vm.selected = [];

        vm.loadQuotes = loadQuotes;
        vm.getCustomFilters = getCustomFilters;
        vm.confirmPoints = confirmPoints;
        vm.cancelPoints = cancelPoints;
        vm.confirmSelectedQuotes = confirmSelectedQuotes;
        vm.cancelSelectedQuotes = cancelSelectedQuotes;

        function loadQuotes() {
            return quotesService.getRewardQuotes().then(function (resp) {
                return resp;
            });
        }

        function confirmPoints(quote) {
            quotesService.confirmRewardPoints([quote.quoteNumber]).result.then(function (quoteIds) {
                handleDecision(quoteIds)
            });
        }

        function cancelPoints(quote) {
            quotesService.cancelRewardPoints([quote.quoteNumber]).result.then(function (quoteIds) {
                handleDecision(quoteIds)
            });
        }

        function confirmSelectedQuotes() {
            quotesService.confirmRewardPoints(vm.selected).result.then(function (quoteIds) {
                handleDecision(quoteIds)
            });
        }

        function cancelSelectedQuotes() {
            quotesService.cancelRewardPoints(vm.selected).result.then(function (quoteIds) {
                handleDecision(quoteIds)
            });
        }

        function handleDecision(quoteIds) {
            var newSelection = [];
            for (var index = 0; index < vm.selected.length; index++) {
                var current = vm.selected[index];
                if (quoteIds.indexOf(current) === -1)
                    newSelection.push(current);
            }
            vm.selected = newSelection;
            vm.refreshDataFlag = true;
        }

        /**
         * @description
         * grid configuration for customers grid
         */
        vm.gridConfig = {};
        vm.agent = {};
        vm.pointAgent = {};

        function getCustomFilters() {
            return [
                { key: "status", value: vm.filteredStatus }
            ];
        }

        function init()
        {
            var promises = [];

            promises.push(portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
            }));

            promises.push(agents.getCurrentAgent().then(function (agent) {
                vm.pointAgent = agent;
            }));

            $q.all(promises).then(function () {
                if (!vm.agent.isSuperUser || !vm.pointAgent || !vm.pointAgent.canUsePoints) {
                    $state.go('dashboard');
                }

                vm.gridConfig = {
                    noDataMessage: 'No quotes to verify',
                    allowMultiSelect: true,
                    hasActions: true,
                    columns: [
                        { header: 'Quote Id', binding: 'quoteNumber', href: 'admin/verifyPointDetails/{{row.quoteNumber}}', preferredWidth: '10%' },
                        { header: 'Points', binding: 'points', preferredWidth: '5%' },
                        { header: 'Primary Traveler', binding: 'travelerName', preferredWidth: '10%' },
                        { header: 'Email', binding: 'travelerEmail', preferredWidth: '10%' },
                        { header: 'Phone', binding: 'travelerPhone', preferredWidth: '10%' },
                        { header: 'Postal Code', binding: 'postalCode', preferredWidth: '5%' },
                        { header: 'Product', binding: 'packageName', preferredWidth: '10%' },
                        { header: 'Quote Date', binding: 'quoteDate', preferredWidth: '10%', filter: "datelocal", filterBinding: 'timezone' }, // filter param is the fallback if the binding is null
                        { header: 'Departure Date', binding: 'departureDates.localized.dateString', preferredWidth: '10%', filter: "date", filterParam: settings.date.format }
                    ],
                    actionList: [
                        { label: "View", icon: "glyphicon-eye-open", href: 'admin/verifyPointDetails/{{row.quoteNumber}}' },
                        { label: "Confirm", icon: "glyphicon-ok-circle", click: vm.confirmPoints, href: '#' },
                        { label: "Cancel", icon: "glyphicon-ban-circle", click: vm.cancelPoints, href: '#' }
                    ],
                    defaultOrderBy: "quoteDate",
                    defaultOrder: false,
                    rowIdentifier: "quoteNumber",
                    agencyId: vm.agent.agencyId
                };

                vm.ready = true;
            });
        }

        init();
    }
})();