(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name quotesController
     *
     * # quotesController
     *
     * @description
     * controller for quotes screen that shows grid of quotes associated with the logged-in user
     */
    angular.module('agentPortal')
        .controller('quotesController', ['$filter', 'quotesService', '$modal', '$timeout', 'settings', 'portalService', 'utilService', 'sendQuoteFactory', '$q', '$state', 'agentService', quotesController]);

    function quotesController($filter, quotesService, $modal, $timeout, settings, portalService, utilService, sendQuoteFactory, $q, $state, agentService) {
        var vm = this;

        vm.title = 'Quotes';

        vm.products = [];
        vm.dateFilters = [];

        vm.filteredProduct = '';
        vm.filteredDate = 'All';

        vm.selected = [];
        vm.agents = [];
        vm.refreshDataFlag = false;
        vm.reloadDataFlag = false;
        vm.ready = false;

        vm.selectedDeleteIds = [];

        function init() {
            getDateFilters();
            var promises = [];

            promises.push(portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;

                if (vm.agent.isSuperUser) {
                    agentService.fetchAgents(agent.agencyId).then(function (results) {
                        if (results) {
                            vm.agents = results;
                        }
                    });
                }

                quotesService.loadAgencyProductsAndPackages(agent.agencyId).then(function (products) {
                    vm.products = products;
                });
            }));

            promises.push(portalService.loadProductsAndPackages().then(function (response) {
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                if (vm.agent.isSuperUser) {
                    vm.gridConfig = {
                        noDataMessage: "No quotes found",
                        allowMultiSelect: true,
                        hasActions: true,
                        columns: [
                            { header: "Quote #", binding: "quoteNumber", preferredWidth: '10%', href: 'quotes/view/{{row.quoteNumber}}' },
                            { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '20%' },
                            { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                            { header: "Product", binding: "packageName", preferredWidth: '1%' },
                            { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Agent Name", binding: "agentName", preferredWidth: '1%' },
                            { header: "Destination", binding: "destinationCountry", preferredWidth: '20%' },
                            { header: "Departure Date", binding: "departureDates.localized.fullDateTime", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Trip Cost", binding: "tripCost", filter: "currency", isCurrency: true, preferredWidth: '1%' }
                        ],
                        actionList: [
                            { label: "View", icon: "glyphicon-eye-open", href: 'quotes/view/{{row.quoteNumber}}' }
                        ],
                        defaultOrderBy: "departureDate.localDate",
                        defaultOrder: false,
                        rowIdentifier: "quoteId",
                        filter: $filter("quotesFilter")
                    };
                }
                else {
                    vm.gridConfig = {
                        noDataMessage: "No quotes found",
                        allowMultiSelect: true,
                        hasActions: true,
                        columns: [
                            { header: "Quote #", binding: "quoteNumber", preferredWidth: '10%', href: 'quotes/view/{{row.quoteNumber}}' },
                            { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '20%' },
                            { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                            { header: "Product", binding: "packageName", preferredWidth: '1%' },
                            { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Destination", binding: "destinationCountry", preferredWidth: '20%' },
                            { header: "Departure Date", binding: "departureDates.localized.fullDateTime", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Trip Cost", binding: "tripCost", filter: "currency", isCurrency: true, preferredWidth: '1%' }
                        ],
                        actionList: [
                            { label: "View", icon: "glyphicon-eye-open", href: 'quotes/view/{{row.quoteNumber}}' }
                        ],
                        defaultOrderBy: "departureDate.localDate",
                        defaultOrder: false,
                        rowIdentifier: "quoteId",
                        filter: $filter("quotesFilter")
                    };
                }
                vm.ready = true;
            });
        }

        /**
         * @description
         * grid implementation - date filters 
         */
        function getDateFilters() {
            vm.dateFilters = quotesService.getDateFilters();
        }

        /**
         * @description
         * grid implementation - loading of quotes data
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
            vm.gridConfig.dateSelected = dateSelected;
            var deferredPromise = $q.defer();
            quotesService.loadPagedData(vm.getCustomFilters()[0].value, vm.getCustomFilters()[1].value, vm.gridConfig.currentPage, vm.gridConfig.orderby, vm.gridConfig.reverse ? 'desc' : 'asc', dateSelected, "", vm.searchText).then(function (results) {
                vm.gridConfig.totalRecords = results.totalRecords;
                for (var i = 0; i < results.quotes.length; i++) {
                    var quote = results.quotes[i];
                    if (quote.subTitle && quote.packageName.indexOf(' ') < 0) {
                        quote.packageName = quote.packageName + " " + quote.subTitle
                    }
                    setQuoteActions(quote);
                }
                deferredPromise.resolve(results.quotes);
            }, function (error) {
                deferredPromise.reject(error);
            });
            return deferredPromise.promise;
        };

        /**
         * @description
         * grid implementation - custom filters
         */
        vm.getCustomFilters = function () {
            return [
                    { key: "agentId", value: vm.agent.isSuperUser ? (vm.filteredAgent ? vm.filteredAgent.agentId : null) : vm.agent.agentId },
                { key: "packageId", value: vm.filteredProduct },
                { key: "date", value: vm.filteredDate }
            ];
        };

        /**
         * @description
         * grid implementation - sets flag to trigger refresh of the grid data, i.e., on filter-change
         */
        vm.refreshData = function () {
            vm.refreshDataFlag = true;
        };

        /**
         * @description
         * grid implementation - sets flag to reload of grid data from the server
         */
        vm.reloadData = function () {
            vm.reloadDataFlag = true;
        };

        /**
         * @description
         * grid implementation - filter-change event handling, triggers refreshData
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
         * grid implementation - reseting of the filters
         */
        vm.clearFilter = function () {
            vm.searchText = "";
            vm.refreshData();
        };

        /**
         * @description
         * removes selected quotes by their ids by calling backend API(s) for soft-delete
         */
        vm.removeQuotes = function (entityIds) {
            if (entityIds.length == 0)
                return;

            quotesService.removeQuotes(entityIds).then(function () {
                vm.refreshSelectionToExclude(entityIds);
                vm.reloadData();
            });
        };

        /**
         * @description
         * grid implementation - refreshes data locally after removing quotes so the removed quotes get excluded from display
         */
        vm.refreshSelectionToExclude = function (entityIds) {
            var newSelection = [];
            for (var index = 0; index < vm.selected.length; index++) {
                var current = vm.selected[index];
                if (entityIds.indexOf(current) === -1)
                    newSelection.push(current);
            }
            vm.selected = newSelection;
        };

        $('#delconfirm').on('hidden.bs.modal', function (e) {
            vm.selectedDeleteIds = [];
        });

        /**
         * @description
         * sets up quotes to be removed once user confirms his intent to remove the quotes 
         */
        vm.confirmRemoveSelectedQuotes = function () {
            vm.selectedDeleteIds = vm.selected;
            $('#delconfirm').modal('toggle');
        };

        /**
         * @description
         * shows confirmation dialog prior to actually removing the selected quotes
         */
        vm.confirmRemoveQuote = function (quote) {
            vm.selectedDeleteIds = [quote.quoteId];
            $('#delconfirm').modal('toggle');
        };

        /**
        * @description
        * displays dialog to send quote details to someone via email
        */
        vm.sendQuote = function (quote) {
            return sendQuoteFactory.sendQuote(quote);
        }

        /**
         * @description
         * sets actions for quotes grid's rows 
         */
        function setQuoteActions(quote) {
            quote.actions = [];
            var selectedPackage = vm.packages.filter(function (p) {
                return p.id == quote.packageId;
            })[0];

            quote.actions.push({ label: "Edit", click: vm.editQuote, icon: "glyphicon-edit", href: "#" });
            quote.actions.push({ label: "Purchase", click: vm.editQuote, icon: "glyphicon-shopping-cart", href: "#" });
            
            if (selectedPackage && selectedPackage.emailQuote === true && quote.fulfillmentMethod === "Email") {
                quote.actions.push({ label: "Send", click: vm.sendQuote, icon: "glyphicon-send", href: "#" });
                
            }

            quote.actions.push({ label: "Remove", click: vm.confirmRemoveQuote, icon: "glyphicon-trash", href: "#" });
        };

        /**
         * @description
         * sends quote via email to user-provided email ids.
         */
        vm.emailQuote = function (quoteId, emailIds) {
            quotesService.emailQuote(quoteId, emailIds.split(','));
        };

        /**
        * @description
        * takes to purchase path
        */
        vm.editQuote = function (quote) {
            // product rating id isn't available on this quote object, so purchaseNavigationService can't
            // be used here
            $state.go("purchasePackageQuote", { ratingId: quote.packageRatingId, quoteId: quote.quoteNumber });
        }

        init();
    }
})();
