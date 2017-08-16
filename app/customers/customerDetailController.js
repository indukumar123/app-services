(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name customerDetailController
     *
     * # customerDetailController
     *
     * @description
     * controller to support activities on customer details page
     */

    angular.module('agentPortal')
        .controller('customerDetailController', ['$q', '$stateParams', '$state', '$filter', '$modal', '$timeout', 'customersService', 'policiesService', 'quotesService', 'utilService', 'settings', 'statePersister', 'portalService', customerDetailController]);

    function customerDetailController($q, $stateParams, $state, $filter, $modal, $timeout, customersService, policiesService, quotesService, utilService, settings, statePersister, portalService) {
        var vm = this;

        vm.customerId = $stateParams.customerId;
        vm.title = 'Customer';
        vm.dateFormat = '';

        vm.customer = {};

        vm.customerPolicies = {};
        vm.customerQuotes = {};
        vm.customerQuotes.selected = [];

        vm.customerPolicies.products = [];
        vm.customerQuotes.products = [];

        vm.customerPolicies.dateFilters = [];
        vm.customerQuotes.dateFilters = [];

        vm.customerPolicyCount = null;

        vm.customerPolicies.filteredProduct = '';
        vm.customerQuotes.filteredProduct = '';

        vm.customerPolicies.filteredDate = 'All';
        vm.customerQuotes.filteredDate = 'All';

        vm.customerPolicies.filteredStatus = '';
        vm.customerQuotes.filteredStatus = '';

        vm.customerPolicies.refreshDataFlag = false;
        vm.customerQuotes.refreshDataFlag = false;

        vm.customerPolicies.reloadDataFlag = false;
        vm.customerQuotes.reloadDataFlag = false;

        /**
         * @description
         * initialization stuff, loading the customer record from service, setting up date formats and filters etc.
         */
        function init() {
            var promises = [];

            promises.push(portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
                quotesService.loadAgencyProductsAndPackages(agent.agencyId).then(function (products) {
                    vm.customerPolicies.products = products;
                    vm.customerQuotes.products = products;
                });
            }));

            promises.push(portalService.loadProductsAndPackages().then(function (response) {
                vm.products = response.products;
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                initializeGrids();

                vm.customerPolicies.dateFilters = policiesService.getDateFilters();
                vm.customerQuotes.dateFilters = quotesService.getDateFilters();

                vm.customerPolicies.statusList = policiesService.getStatusList();

                vm.load(vm.customerId);
                vm.dateFormat = settings.date.format;

                vm.ready = true;
            });
        }

        /**
         * @description
         * retrieves customer by given id ...
         */
        vm.load = function () {
            customersService.getById(vm.customerId).then(function (customer) {
                vm.customer = customer;
                if (vm.customer.gender) {
                    vm.customer.gender = capatilizeFirstLetter(vm.customer.gender);
                }
            });
        };

        /**
         * @description
         * Capatalizes first letter of a string
         */
        function capatilizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }


        /**
         * @description
         * navigates the user to purchase page for the available product packages...
         */
        vm.goToPurchase = function () {
            if (vm.customer.address) {
                statePersister.persist(vm.customer.address.stateOrProvince);
            }
            $state.go('quickquoteCustomerPage', { customerId: vm.customerId });
        };

        /**
         * @description
         * removes the customer from the agents view...
         */
        vm.removeCustomer = function () {
            customersService.removeCustomer(vm.customerId, 'customers', vm.customer.firstName, vm.customer.lastName);
        };

        /**
         * @description
         * loads customer's policies from the server
         */
        vm.customerPolicies.loadData = function () {
            var dateRange = utilService.getDateRange(vm.customerPolicies.filteredDate);

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
            vm.customerPolicies.gridConfig.dateSelected = dateSelected;
            var deferredPromise = $q.defer();
            policiesService.loadPagedData(vm.customerPolicies.getCustomFilters()[3].value, vm.customerPolicies.getCustomFilters()[0].value, vm.customerPolicies.gridConfig.currentPage, vm.customerPolicies.gridConfig.orderby, vm.customerPolicies.gridConfig.reverse ? 'asc' : 'desc', dateSelected, vm.customerId, vm.customerPolicies.searchText, vm.customerPolicies.getCustomFilters()[2].value).then(function (results) {
                vm.customerPolicies.gridConfig.totalRecords = results.totalRecords;
                if (results.policies) {
                    if (vm.customerPolicyCount == null) {
                        vm.customerPolicyCount = results.policies.length;
                    }
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
        };

        /**
         * @description
         * loads customer's quotes from the server
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
            quotesService.loadPagedData(vm.customerQuotes.getCustomFilters()[0].value, vm.customerQuotes.getCustomFilters()[1].value, vm.customerQuotes.gridConfig.currentPage, vm.customerQuotes.gridConfig.orderby, vm.customerQuotes.gridConfig.reverse ? 'desc' : 'asc', dateSelected, vm.customerId, vm.customerQuotes.searchText).then(function (results) {
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
            var selectedPackage = vm.packages.filter(function (p) {
                return p.id == quote.packageId;
            })[0];
            quote.actions.push({ label: "Edit", click: vm.customerQuotes.editQuote, icon: "glyphicon-edit", href: "#" });
            quote.actions.push({ label: "Purchase", click: vm.customerQuotes.editQuote, icon: "glyphicon-shopping-cart", href: "#" });

            if (selectedPackage && selectedPackage.emailQuote) {
                quote.actions.push({ label: "Send", click: vm.customerQuotes.sendQuote, icon: "glyphicon-send", href: "#" });
            }

            quote.actions.push({ label: "Remove", click: vm.customerQuotes.confirmRemoveQuote, icon: "glyphicon-trash" });
        };

        /**
         * @description
         * reloads customer's quotes from the server
         */
        vm.customerQuotes.reloadData = function () {
            vm.customerQuotes.reloadDataFlag = true;
        };

        /**
         * @description
         * reloads customer's policies from the server
         */
        vm.customerPolicies.reloadData = function () {
            vm.customerPolicies.reloadDataFlag = true;
        };

        /**
        * @description
        * takes to purchase path
        */
        vm.customerQuotes.editQuote = function (quote) {
            // product rating id isn't available on this quote object, so purchaseNavigationService can't
            // be used here
            $state.go("purchasePackageQuote", { ratingId: quote.packageRatingId, quoteId: quote.quoteId });
        }

        /**
         * @description
         * returns filters for policies grid ...
         */
        vm.customerPolicies.getCustomFilters = function () {
            return [
                { key: "packageId", value: vm.customerPolicies.filteredProduct },
                { key: "date", value: vm.customerPolicies.filteredDate },
                { key: "status", value: vm.customerPolicies.filteredStatus },
                { key: "agentId", value: vm.agent.isSuperUser ? (vm.filteredAgent ? vm.filteredAgent.agentId : null) : vm.agent.agentId }
            ];
        };

        /**
         * @description
         * returns custom filters for policies/quotes grids ...
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
         * refreshes policies grid data i.e., whenever filter selection changes
         */
        vm.customerPolicies.refreshData = function () {
            vm.customerPolicies.refreshDataFlag = true;
        };

        /**
         * @description
         * refreshes quotes grid data i.e., whenever filter selection changes
         */
        vm.customerQuotes.refreshData = function () {
            vm.customerQuotes.refreshDataFlag = true;
        };

        /**
         * @description
         * filter change event for policies grid, basically invokes function to refresh grids 
         */
        vm.customerPolicies.filterChanged = function () {
            vm.customerPolicies.refreshData();
        };

        var timeout;
        vm.customerPolicies.searchChanged = function () {
            if (vm.agent.isSuperUser) {
                if (vm.customerPolicies.timer) {
                    $timeout.cancel(vm.customerPolicies.timer);
                }
                vm.customerPolicies.timer = $timeout(function () {
                    vm.customerPolicies.filterChanged();
                }, global_echo_timeout);
            }
            else {
                vm.customerPolicies.filterChanged();
            }
        }

        /**
         * @description
         * filter change event for quotes grid, basically invokes function to refresh grid
         */
        vm.customerQuotes.filterChanged = function () {
            vm.customerQuotes.refreshData();
        };

        vm.customerQuotes.searchChanged = function () {
            if (vm.agent.isSuperUser) {
                if (vm.customerQuotes.timer) {
                    $timeout.cancel(vm.customerQuotes.timer);
                }
                vm.customerQuotes.timer = $timeout(function () {
                    vm.customerQuotes.filterChanged();
                }, global_echo_timeout);
            }
            else {
                vm.customerQuotes.filterChanged();
            }
        }


        /**
         * @description
         * clears filter on policies grid
         */
        vm.customerPolicies.clearFilter = function () {
            vm.customerPolicies.searchText = "";
            vm.customerPolicies.refreshData();
        };

        /**
         * @description
         * clears filter on quotes grid
         */
        vm.customerQuotes.clearFilter = function () {
            vm.customerQuotes.searchText = "";
            vm.customerQuotes.refreshData();
        };

        /**
         * @description
         * removes selected quotes from the quotes grid by calling backend APIs for soft-delete
         */
        vm.customerQuotes.removeQuotes = function (entityIds) {
            if (entityIds.length == 0)
                return;

            quotesService.removeQuotes(entityIds).then(function () {
                vm.customerQuotes.refreshSelectionToExclude(entityIds);
                vm.customerQuotes.reloadData();
            });
        };

        /**
         * @description
         * refreshes selection to exclude selected (i.e., just removed) quote IDs
         */
        vm.customerQuotes.refreshSelectionToExclude = function (entityIds) {
            var newSelection = [];
            for (var index = 0; index < vm.customerQuotes.selected.length; index++) {
                var current = vm.customerQuotes.selected[index];
                if (entityIds.indexOf(current) === -1)
                    newSelection.push(current);
            }
            vm.customerQuotes.selected = newSelection;
        };

        $('#delconfirm').on('hidden.bs.modal', function (e) {
            vm.customerQuotes.selectedDeleteIds = [];
        });

        /**
         * @description
         * prompts user to confirm prior to removing the selected quote(s)
         */
        vm.customerQuotes.confirmRemoveQuote = function (quote) {
            vm.customerQuotes.selectedDeleteIds = [quote.quoteId];
            $('#delconfirm').modal('toggle');
        };

        /**
         * @description
         * shows email-quote dialog so the quote can be sent to anyone with email ID.
         */
        vm.customerQuotes.sendQuote = function (quote) {
            $modal.open({
                templateUrl: 'app/quotes/sendQuoteModal.html',
                backdrop: true,
                windowClass: 'modal',
                controller: 'sendQuoteController',
                resolve: {
                    quote: function () {
                        return quote;
                    }
                }
            });
        };

        /**
         * @description
         * posts the send-quote form to actually send the email to the emails provided by the user.
         */
        vm.customerQuotes.emailQuote = function (quoteId, emailIds) {
            //split email ids provided by user in the additional emails text-area
            quotesService.emailQuote(quoteId, emailIds.split(','));
        };

        function initializeGrids() {
            /**
         * @description
         * grid configuration for policies grid
         */
            if (vm.agent.isSuperUser) {
                vm.customerPolicies.gridConfig = {
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
                    filter: $filter("policiesFilterPurchaseDate")
                };
            }
            else {
                vm.customerPolicies.gridConfig = {
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
                    filter: $filter("policiesFilterPurchaseDate")
                };
            }

            /**
             * @description
             * grid configuration for quotes grid
             */
            if (vm.agent.isSuperUser) {
                vm.customerQuotes.gridConfig = {
                    noDataMessage: "No quotes found",
                    allowMultiSelect: false,
                    hasActions: true,
                    columns: [
                        { header: "Quote #", binding: "quoteNumber", href: 'quotes/view/{{row.quoteNumber}}', preferredWidth: '10%' },
                        { header: "Product", binding: "packageName", preferredWidth: '1%' },
                        { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Departure Date", binding: "departureDates.localized.dateString", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Policy Holder", binding: "policyHolderName" },
                        { header: "Agent", binding: "agentName", preferredWidth: '1%' },
                        { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                        { header: "Destination", binding: "destinationCountry", preferredWidth: '1%' },
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
                        { header: "Quote #", binding: "quoteNumber", href: 'quotes/view/{{row.quoteNumber}}', preferredWidth: '10%' },
                        { header: "Product", binding: "packageName", preferredWidth: '1%' },
                        { header: "Quote Date", binding: "purchaseDate", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Departure Date", binding: "departureDates.localized.dateString", filter: "date", filterParam: settings.date.format, preferredWidth: '1%' },
                        { header: "Policy Holder", binding: "policyHolderName" },
                        { header: "Travelers", binding: "travelerCount", preferredWidth: '1%' },
                        { header: "Destination", binding: "destinationCountry", preferredWidth: '1%' },
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
        }

        /**
         * @description
         * grid implementation - cancel Policy
         */
        vm.cancelPolicy = function (actions) {
            var policy = actions.policyNumber;
            policiesService.confirmCancelPolicy(
                actions,
                function (result) {
                    vm.customerPolicies.refreshData();
                    vm.customerPolicies.reloadData();
                }
            );
        }

        init();
    }
})();
