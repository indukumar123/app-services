(function () {
    'use strict';

    /**
    * @ngdoc controller
    * @name quickQuotesController
    *
    * # quickQuotesController
    *
    * @description
    * controller to support interactions for CTA to eligible quote page 
    */

    angular.module('agentPortal')
        .controller('quickQuotesController',
                        ['$rootScope', '$stateParams', 'quickQuotesService', 'portalService', '$q',
                            'eligibilityFactory', 'storage', 'format', 'sendQuoteFactory', 'eligibilityService', 'ambassadorInformationSessionStorage', quickQuotesController]);

    function quickQuotesController($rootScope, $stateParams, quickQuotesService, portalService, $q, eligibilityFactory, storage, format, sendQuoteFactory, eligibilityService, ambassadorInformationSessionStorage) {
        var vm = this;
        
        // key for retreiving cta state from storagew
        var storageKey = "quickquote";

        // loading flags so that product tiles dont pop in before quoting completes
        var isLoadingPackages = false;
        var isQuoting = false;

        vm.state = {};
        vm.state.customerId = null;
        vm.state.customer = null;
        vm.showProductTable = false;
        vm.tempQuote = null;
        vm.currentState = null;
        vm.currentAgentCode = null;
        vm.lookupDataUrl = {};
        vm.packages = [];
        vm.faqPackages = [];
        vm.quoteToProcess = [];
        vm.isAmbassador = false;
        vm.agent = null;
        /**
        * @description
        * initialize quote request controller
        */
        function init() {
            var promises = [];

            // Set up the logged in agent
            vm.agent = portalService.getCurrentAgent();

            // sets up customer id, customer Id's may come from the url
            if ($stateParams.customerId) {
                vm.state.customerId = $stateParams.customerId;
            }

            // Set up requestId that came from Sales Force
            if ($stateParams.requestId) {
                vm.state.requestId = $stateParams.requestId;
            }

            // If the ambassador is helping an agent,  set up the agent code, or set the agent code to the logged in agent
            vm.currentAgentCode = ambassadorInformationSessionStorage.getAgentCode() ? ambassadorInformationSessionStorage.getAgentCode() : vm.agent.agentCode;

            // initialize CTA if there is data
            var quickQuoteData = storage.get(storageKey);
            if (quickQuoteData) {
                vm.state.cta = quickQuoteData.cta;
                vm.tempQuote = vm.tempQuote ? vm.tempQuote : quickQuoteData.cta;
            }

            promises.push(vm.getAllPackages());

            $q.all(promises).then(function () {
                vm.ready = true;

                // pull the quick quote data from session
                var quickQuoteData = storage.get(storageKey);
                copyQuickQuoteData(quickQuoteData);
            });
        }

        vm.getQuotes = function (quickQuoteData) {
            copyQuickQuoteData(quickQuoteData);
            isLoadingPackages = false;
            isQuoting = false;
        }

        function copyQuickQuoteData(quickQuoteData) {
            if (quickQuoteData) {
                vm.state.cta = quickQuoteData.cta;
                vm.quotes = quickQuoteData.quotes;
                vm.packages = quickQuoteData.packages;
                vm.faqPackages = quickQuoteData.faqPackages;

                if (vm.quotes && vm.quotes.length > 0) {
                    vm.showProductTable = true
                }

                // clear the data
                storage.set(storageKey, null)
            }
            else {
                vm.state.cta = quickQuotesService.getCombinedQuoteRequest(null);
            }
        }

        /**
         * @description
         * Used by the template to determine whether or not to show PCT, Product Tiles, or FAQ
         */
        vm.showProductInformation = function () {
            return !(isLoadingPackages || isQuoting) && vm.packages.length > 0;
        }

        /**
         * @description
         * Gets a list of all packages, sorts them on name, and assigns them to collections
         */
        vm.getAllPackages = function () {
            isLoadingPackages = true;

            return portalService.loadPackagesForAgentApi(vm.currentAgentCode).then(function (response) {
                var packages = response.packages;
                packages.sort(sortOn("name"));
                vm.originalPackages = packages;
                vm.packages = packages;
                vm.faqPackages = packages;
                vm.quotes = [];
                isLoadingPackages = false;
            }, function (err) {
                isLoadingPackages = false;
            });
        }

        /**
         * @description
         * Sets package collections equal to the original packages loaded. Hides the PCT to show the tiles
         */
        vm.resetAllPackages = function () {
            vm.packages = vm.originalPackages;
            vm.faqPackages = vm.originalPackages;
            vm.quotes = [];
            vm.showProductTable = false;
        }

        function sortOn(property) {
            return function (a, b) {
                if (a[property] < b[property]) {
                    return -1;
                } else if (a[property] > b[property]) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }

        vm.suppressWarning = function () {
            return portalService.getCurrentAgentIsAmbassador();
        };


        vm.sendQuickQuote = function sendQuickQuote(packagesToQuote) {
            var quickQuoteRequest = createQuickQuoteRequest();
            sendQuoteFactory.sendQuickQuote(quickQuoteRequest, packagesToQuote);
        }

        function createQuickQuoteRequest() {
            var destinationCountry = null;
            if (vm.state.cta.destinationCountry) {
                if (typeof vm.state.cta.destinationCountry === 'string') {
                    destinationCountry = vm.state.cta.destinationCountry
                }
                else if (vm.state.cta.destinationCountry.isoCode2) {
                    destinationCountry = vm.state.cta.destinationCountry.isoCode2;
                }
            }

            var quickQuoteRequest = {
                recipients: [],
                agentCarbonCopy: null,
                message: null,
                residenceState: vm.state.cta.residenceState,
                destinationCountry: destinationCountry,
                departureDate: vm.state.cta.departureDate,
                returnDate: vm.state.cta.returnDate,
                depositDate: vm.state.cta.depositDate,
                travelers: [],
                quotes: []
            };

            var primaryTraveler = {
                birthdate: vm.state.cta.primaryTraveler.birthDate,
                tripCost: vm.state.cta.primaryTraveler.tripCost,
                isPrimary: true
            };

            quickQuoteRequest.travelers.push(primaryTraveler);

            for (var i = 0; i < vm.state.cta.additionalTravelers.length; i++) {
                var traveler = vm.state.cta.additionalTravelers[i];
                var quickQuoteTraveler = {
                    birthdate: traveler.birthDate,
                    tripCost: traveler.tripCost,
                    isPrimary: false
                };

                quickQuoteRequest.travelers.push(quickQuoteTraveler);
            }

            return quickQuoteRequest;
        }

        init();
    }
})();