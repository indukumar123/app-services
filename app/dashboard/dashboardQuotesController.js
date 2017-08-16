(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name dashboardQuotesController
     *
     * # dashboardQuotesController
     *
     * @description
     * controls quotes aspects showing up on the dashboard page
     */
    angular.module('agentPortal')
        .controller('dashboardQuotesController', ['$stateParams', '$filter', '$modal', '$timeout', 'quotesService', 'settings', 'utilService', 'sendQuoteFactory', '$q', 'portalService', '$state', dashboardQuotesController]);

    function dashboardQuotesController($stateParams, $filter, $modal, $timeout, quotesService, settings, utilService, sendQuoteFactory, $q, portalService, $state) {
        var vm = this;

        vm.title = '';
        vm.dateFormat = '';
        vm.customerQuotes = {};
        vm.customerQuotes.products = [];
        vm.customerQuotes.dateFilters = [];
        vm.customerQuotes.filteredProduct = '';
        vm.customerQuotes.filteredDate = 'All';
        vm.customerQuotes.filteredStatus = '';
        vm.customerQuotes.refreshDataFlag = false;
        vm.customerQuotes.reloadDataFlag = false;
        vm.customerQuotes.selectedDeleteIds = [];
        vm.ready = false;
        
        function init() {
            vm.title = 'Quotes';
            vm.dateFormat = settings.dateFormat;
            vm.customerQuotes.dateFilters = quotesService.getDateFilters();
            vm.dateFormat = settings.date.format;

            // modal backdrop does not get removed when cancelling a policy edit so we have to remove it here
            $('.modal-backdrop.fade.in').remove();
            $('body').removeClass('modal-open');

            var promises = [];

            // TODO get the packages for an agent passed in
            promises.push(portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
                quotesService.loadAgencyProductsAndPackages(agent.agencyId).then(function (products) {
                    vm.customerQuotes.products = products;
                });
            }));

            promises.push(portalService.loadProductsPackagesFromClientsApi().then(function (response) {
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                if (vm.agent.isSuperUser) {
                    vm.customerQuotes.gridConfig = {
                        noDataMessage: "No quotes found",
                        allowMultiSelect: false,
                        hasActions: true,
                        columns: [
                            { header: "Quote #", binding: "quoteNumber", preferredWidth: '10%', href: 'quotes/view/{{row.quoteNumber}}' },
                            { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '19%' },
                            { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                            { header: "Product", binding: "packageName", preferredWidth: '1%' },
                            { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Agent Name", binding: "agentName", preferredWidth: '1%' },
                            { header: "Destination", binding: "destinationCountry", preferredWidth: '20%' },
                            { header: "Departure Date", binding: "departureDates.localized.dateString", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Trip Cost", binding: "tripCost", filter: "currency", isCurrency: true, preferredWidth: '1%' }
                        ],
                        actionList: [
                            { label: "View", icon: "glyphicon-eye-open", href: 'quotes/view/{{row.quoteNumber}}' }
                        ],
                        defaultOrderBy: "departureDates.localized.dateString",
                        defaultOrder: false,
                        rowIdentifier: "quoteNumber",
                        filter: $filter("quotesFilter")
                    };
                }
                else {
                    vm.customerQuotes.gridConfig = {
                        noDataMessage: "No quotes found",
                        allowMultiSelect: false,
                        hasActions: true,
                        columns: [
                            { header: "Quote #", binding: "quoteNumber", preferredWidth: '10%', href: 'quotes/view/{{row.quoteNumber}}' },
                            { header: "Primary Traveler", binding: "policyHolderName", preferredWidth: '19%' },
                            { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                            { header: "Product", binding: "packageName", preferredWidth: '1%' },
                            { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Destination", binding: "destinationCountry", preferredWidth: '20%' },
                            { header: "Departure Date", binding: "departureDates.localized.dateString", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                            { header: "Trip Cost", binding: "tripCost", filter: "currency", isCurrency: true, preferredWidth: '1%' }
                        ],
                        actionList: [
                            { label: "View", icon: "glyphicon-eye-open", href: 'quotes/view/{{row.quoteNumber}}' }
                        ],
                        defaultOrderBy: "departureDates.localized.dateString",
                        defaultOrder: false,
                        rowIdentifier: "quoteNumber",
                        filter: $filter("quotesFilter")
                    };
                }

                vm.ready = true;
            });
        }

        /**
        * @description
        * loads customer qutoes information 
        */
        vm.customerQuotes.loadData = function () {
                var dateRange = utilService.getDateRange(vm.customerQuotes.filteredDate);

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
                vm.customerQuotes.gridConfig.dateSelected = dateSelected;
                var deferredPromise = $q.defer();
                quotesService.loadPagedData(vm.customerQuotes.getCustomFilters()[0].value, vm.customerQuotes.getCustomFilters()[1].value, vm.customerQuotes.gridConfig.currentPage, vm.customerQuotes.gridConfig.orderby, vm.customerQuotes.gridConfig.reverse ? 'desc' : 'asc', dateSelected, "", vm.customerQuotes.searchText).then(function (results) {
                    vm.customerQuotes.gridConfig.totalRecords = results.totalRecords;
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
         * sets actions for quotes grid's rows 
         */
        function setQuoteActions(quote) {
            quote.actions = [];
            var selectedpackage = vm.packages.filter(function (p) {
                return p.id == quote.packageId;
            })[0];
            quote.actions.push({ label: "Edit", click: vm.customerQuotes.editQuote, icon: "glyphicon-edit", href: "#" });
            quote.actions.push({ label: "Purchase", click: vm.customerQuotes.editQuote, icon: "glyphicon-shopping-cart", href: "#" });
            if (selectedpackage && quote.fulfillmentMethod === "Email") {
                var WebEnabled = selectedpackage.availablePlatform.split(';').filter(function f(a) { return a == 'Web' }).length;

                if (WebEnabled > 0) {
                    quote.actions.push({ label: "Send", click: vm.customerQuotes.sendQuote, icon: "glyphicon-send", href: "#" });
                }
                else {
                    quote.actions.push({ label: "Send", disabled: true, click: "", icon: "glyphicon-send", href: "" });
                }
            }
        };

        /**
        * @description
        * custom filters for customer qutoes
        */
        vm.customerQuotes.getCustomFilters = function () {
            return [
                { key: "agentId", value: vm.agent.agentId },
                { key: "packageId", value: vm.customerQuotes.filteredProduct },
                { key: "date", value: vm.customerQuotes.filteredDate }
            ];
        };


        /**
        * @description
        * takes to purchase path
        */
        vm.customerQuotes.editQuote = function (quote) {
            // product rating id isn't available on this quote object, so purchaseNavigationService can't
            // be used here
            $state.go("purchasePackageQuote", { ratingId: quote.packageRatingId, quoteId: quote.quoteNumber });
        }

        /**
        * @description
        * refreshes customer quotes grid
        */
        vm.customerQuotes.refreshData = function () {
            vm.customerQuotes.refreshDataFlag = true;
        };

        /**
        * @description
        * grid implementation for customer quotes - filter changed event handling - refreshes grid data
        */
        vm.customerQuotes.filterChanged = function () {
            vm.customerQuotes.refreshData();
        };

        var timeout;
        vm.customerQuotes.searchChanged = function () {
            if (vm.agent.isSuperUser) {
                if (vm.customerQuotes.timer) {
                    $timeout.cancel(vm.customerQuotes.timer);
                }
                vm.customerQuotes.timer = $timeout(function () {
                    vm.customerQuotes.filterChanged();
                }, 60); //global_echo_timeout);
            }
            else {
                vm.customerQuotes.filterChanged();
            }
        }

        /**
        * @description
        * grid implementation for customer quotes - clear filter implementation
        */
        vm.customerQuotes.clearFilter = function () {
            vm.customerQuotes.searchText = "";
            vm.customerQuotes.refreshData();
        };

        /**
        * @description
         * grid implementation - sets flag to reload of grid data from the server
         */
        vm.customerQuotes.reloadData = function () {
            vm.customerQuotes.reloadDataFlag = true;
        };

        $('#delconfirm').on('hidden.bs.modal', function (e) {
            vm.customerQuotes.selectedDeleteIds = [];
        });

        /**
         * @description
         * shows confirmation dialog prior to actually removing the selected quotes
         */
        vm.customerQuotes.confirmRemoveQuote = function (quote) {
            vm.customerQuotes.selectedDeleteIds = [quote.quoteId];
            $('#delconfirm').modal('toggle');
        }

        /**
         * @description
         * removes selected quotes by their ids by calling backend API(s) for soft-delete
         */
        vm.customerQuotes.removeQuotes = function (entityIds) {
            if (entityIds.length == 0)
                return;

            quotesService.removeQuotes(entityIds).then(function () {
                //vm.refreshSelectionToExclude(entityIds);
                vm.customerQuotes.reloadData();
            }, function () { });
        };

        /**
        * @description
        * displays dialog to send quote details to someone via email
        */
        vm.customerQuotes.sendQuote = function (quote) {
            return sendQuoteFactory.sendQuote(quote);
        };   
        
        init();
    }
})();
