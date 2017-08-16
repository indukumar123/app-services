(function () {
    'use strict';

    /**
     * Quick Quote Directive
     *
     * Pass in redirectTo if you want the directive to redirect the user to a different page when clicking Get A Quote.
     * The CTA will be saved into session with the key "quickquote"
     *
     * If this directive is on a page, and you would like to load the cta from session, pass it in via quoteCta.
     * The data will be filled in the UI and the controller
     *
     * onResetPackages accepts a function, and is called when data points change in the UI
     *
     * onGetAQuote is the function that gets called when the user clicks Get A Quote and the redirectTo has not been defined.
     */

    angular
        .module('agentPortal')
        .directive('quickQuoteDirective', quickQuoteDirective);

    function quickQuoteDirective() {
        return {
            restrict: 'EA',
            scope: {
                redirectTo: '@',
                quoteCta: '=',
                tempQuote: '=',
                currentState: '=',
                currentAgentCode: '=',
                onResetAllPackages: '=',
                onGetAQuote: '=',
                agent: '=',
                packages: '='
            },
            templateUrl: 'app/directives/quickquote/quickQuoteDirective.html',
            controller: quickQuoteController,
            controllerAs: "vm",
            bindToController: true
        }
    }

    quickQuoteController.$inject = ['$rootScope', '$stateParams', '$state', '$location', 'settings', 'quickQuotesService',
        'lookupDataService', 'customersService', 'format', 'portalService', '$q', '$interval', '$timeout', 'eligibilityService', 'storage'];

    function quickQuoteController($rootScope, $stateParams, $state, $location, settings, quickQuotesService, lookupDataService, customersService, format, portalService, $q, $interval, $timeout, eligibilityService, storage) {
        var vm = this;

        var storageKey = "quickquote";

        vm.state = {};
        vm.state.customerId = null;
        vm.state.customer = null;
        vm.state.readOnly = false;
        vm.showProductTable = false;
   
        vm.faqPackages = [];
        vm.ctaLoaded = false;

        /**
        * @description
        * initialize quick quote directive controller
        */
        function init() {
            vm.errors = settings.errors;

            var promises = [];

            if (!vm.state.packageStateConfig) {
                vm.state.packageStateConfig = eligibilityService.getPackageStateConfiguration();
            }

            if ($stateParams.customerId) {
                vm.state.readOnly = true;
                vm.state.customerId = $stateParams.customerId;
                customersService.getById(vm.state.customerId).then(function (customer) {
                    vm.state.customer = customer;
                    vm.state.cta = quickQuotesService.getCombinedQuoteRequest(vm.state.customer);
                    vm.ctaLoaded = true;
                    if (customer && customer.address && customer.address.stateOrProvince) {
                        vm.currentState = customer.address.stateOrProvince;
                    }
                });
            }
            else {
                vm.state.cta = quickQuotesService.getCombinedQuoteRequest(null);
                vm.ctaLoaded = true;
            }

            if (vm.quoteCta) {
                vm.state.cta = vm.quoteCta;
                vm.ctaLoaded = true;
                vm.currentState = vm.quoteCta.residenceState;
            }
        }

        vm.onStateChanged = function (newState) {
            vm.currentState = newState;
        }

        vm.onAgentCodeChanged = function (newAgentCode) {
            vm.currentAgentCode = newAgentCode;
        }

        vm.onServiceCall = function (inProgress) {
            if (inProgress === true) {
                $rootScope.$broadcast('showOverlay');
            }
            else {
                $rootScope.$broadcast('hideOverlay');
            }
        }

        vm.onTempQuoteChanged = function (tempQuote) {
            vm.tempQuote = tempQuote;
        }

        vm.onServiceError = function (errorMessage) {

        }

        vm.onValidQuote = function (smartQuote) {
            var quotes = [];
            var packages = [];
            var faqPackages = [];
            for (var i = 0; i < smartQuote.response.length; i++) {
                var processedQuote = smartQuote.response[i];
                if (processedQuote) {
                    var coverages = [];
                    if (processedQuote.coverages) {
                        if (processedQuote.coverages['included']) {
                            for (var j = 0; j < processedQuote.coverages['included'].length; j++) {
                                coverages.push(processedQuote.coverages['included'][j]);
                            }
                        }

                        if (processedQuote.coverages['optional']) {
                            for (var j = 0; j < processedQuote.coverages['optional'].length; j++) {
                                coverages.push(processedQuote.coverages['optional'][j]);
                            }
                        }
                    }

                    var addPackage = true;
                    if (processedQuote.package) {
                        var isInternational = false;
                        if (vm.state.cta.destinationCountry && vm.state.cta.destinationCountry.isoCode2 !== 'US') {
                            isInternational = true;
                        }

                        if ((processedQuote.package.availability === 'International' && !isInternational) ||
                            processedQuote.package.availability === 'Domestic' && isInternational) {
                            addPackage = false;
                        }
                    }

                    // remove any packages that had API errors
                    if (processedQuote.messages && processedQuote.messages.length > 0) {
                        addPackage = false;
                    }

                    if (addPackage) {
                        processedQuote.package.coverages = coverages;
                        quotes.push(angular.copy(processedQuote));
                        packages.push(angular.copy(processedQuote.package));
                    }
                }
            }

            if (packages && packages.length > 0) {
                faqPackages = packages;
            }

            var quickQuoteData = {
                cta: vm.state.cta,
                faqPackages: faqPackages,
                packages: packages,
                quotes: quotes
            }

            if (vm.redirectTo) {   
                storage.set(storageKey, quickQuoteData);
                $state.go(vm.redirectTo);
            }
            else if (vm.onGetAQuote) {
                vm.onGetAQuote(quickQuoteData)
            }
        }

        /**
         * @description
         * runs the function passed into the directive for resetting pacakges if one is defined
         */
        vm.resetAllPackages = function () {
            if (vm.onResetAllPackages) {
                vm.onResetAllPackages();
            }
        }

        init();
    }
})();