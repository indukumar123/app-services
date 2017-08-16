(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name policyDetailController
     *
     * # policyDetailController
     *
     * @description
     * controller for view policy page
     */
    angular.module('agentPortal')
        .controller( 'policyDetailController', 
            ['$stateParams', '$state', '$modal', 'policiesService', 'lookupDataService',
                'utilService', 'settings', 'portalService', 'format', '$q', '$window', 'customersService', 
                '$cookies', 'paymentMethods', policyDetailController] );

    function policyDetailController($stateParams, $state, $modal, policiesService, lookupDataService, utilService, settings, portalService, format, $q, $window, customersService, $cookies, paymentMethods) {
        var vm = this;

        vm.policyNumber = $stateParams.policyNumber;
        vm.title = '';
        vm.dateFormat = '';

        vm.policyDetail = {};
        vm.passengers = [];
        vm.coverages = [];
        vm.flights = [];
        vm.policyDetail.canBeEdited = true;
        vm.policyDetail.canBeCancelled = true;
        vm.isAirCare = false;
        vm.showCoverageBreakup = false;
        vm.showPayMethod = true;
        vm.packages = [];
        vm.isEmailQuote = false;

        vm.loadPolicy = function () {
            policiesService.getById(vm.policyNumber)
                .then(setCurrent)
                .catch(setError);
        };

        /**
         * @descriptions
         * show travelers if present 
         */
        vm.showTravelers = function () {
            return vm.passengers && vm.passengers.length > 0;
        };

        /**
         * @descriptions
         * show flights if present 
         */
        vm.showFlights = function () {
            return vm.flights && vm.flights.length > 0;
        };

        /**
         * @descriptions
         * show travelers and flight section if any present 
         */
        vm.showMidSection = function () {
            return vm.showTravelers() || vm.showFlights();
        };

        /**
         * @descriptions
         * show trip cost 
         */
        vm.showTripCost = function () {
            if (vm.isAirCare || !vm.policyDetail || !vm.policyDetail.tripCost)
                return false;
            return vm.policyDetail.tripCost && vm.policyDetail.tripCost > 0;
        };

        vm.departureDate = function () {
            if ( !vm.policyDetail || !vm.policyDetail.departureDates || !vm.policyDetail.departureDates.localized ||
                        !vm.policyDetail.departureDates.localized.dateString) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.policyDetail.departureDates.localized.dateString) + 
                        ' ' + vm.policyDetail.departureDates.timeZoneAbbreviation;
        };

        vm.returnDate = function () {
            if ( !vm.policyDetail || !vm.policyDetail.returnDates || !vm.policyDetail.returnDates.localized || 
                        !vm.policyDetail.returnDates.localized.dateString ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.policyDetail.returnDates.localized.dateString ) +
                        ' ' + vm.policyDetail.returnDates.timeZoneAbbreviation;
        };

        vm.rentalCarPickupDate = function () {
            if (!vm.policyDetail || !vm.policyDetail.rentalCarPickupDate) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.policyDetail.rentalCarPickupDate);
        };

        vm.rentalCarReturnDate = function () {
            if (!vm.policyDetail || !vm.policyDetail.rentalCarReturnDate) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.policyDetail.rentalCarReturnDate);
        };

        vm.getRowIndexClass = function (number) {
            return utilService.isOddIndexNumber(number) ? 'odd' : '';
        };

        vm.getDataRowClass = function (acknowledgements) {
            return acknowledgements && acknowledgements.length ? 'view-acknowledgements-data' : '';
        };

        function init() {
            vm.title = 'Policy ' + vm.policyNumber;
            vm.dateFormat = settings.date.format;

            // modal backdrop does not get removed when cancelling a policy edit so we have to remove it here
            $('.modal-backdrop.fade.in').remove();
            $('body').removeClass('modal-open');

            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
            });

            portalService.loadProductsAndPackages().then(function (response) {
                vm.packages = response.packages;
                vm.loadPolicy();
            });
        }

        /**
         * @description
         * sets current policy to be displayed
         */
        function setCurrent(result) {
            vm.policyDetail = result.policy;
            vm.passengers = result.travelers;

            // implementing logic from sdk/consumer site for displaying dates consistently
            vm.displayLocalEffectiveDate = getDateStructValue(vm.policyDetail.localEffectiveDate);
            vm.displayLocalExpirationDate = getDateStructValue(vm.policyDetail.localExpirationDate);

            vm.flights = result.flights;
            // format dates using local date strings
            if (vm.flights && vm.flights.length > 0) {
                for (var i = 0; i < vm.flights.length; i++) {
                    vm.flights[i].departureDate = format.getLocalDateDisplayString(vm.flights[i].localDepartureDate, 'MM/DD/YYYY');
                    vm.flights[i].arrivalDate = format.getLocalDateDisplayString(vm.flights[i].localArrivalDate, 'MM/DD/YYYY');
                }
            }

            vm.coverages = getCoveragesOfPrimaryHolder(result.travelers);
            vm.showCoverageBreakup = !vm.isAirCare;
            vm.transactions = result.transactionRecords;

            vm.isEmailQuote = vm.primaryTraveler.email !== null;

            vm.isAirCare = utilService.isAircare(result.policy.packageRatingId);
           
            getDestination().then(function (destination) {
                vm.destination = destination;
            });

            if (vm.agent.isAmbassador) {
                hideEditCancelPolicy();
            }
        }

        function getDateStructValue(newValue) {
            let date = moment(newValue);

            if (date.isValid()) {
                return date.parseZone(newValue).format("MM/DD/YYYY");
            }
            else {
                return null;
            }
        }

        /**
        * @description
        * Show Error
        */
        function setError(error) {
            vm.policyNumber = '';
            vm.policyError = error.exceptionMessage;
            vm.policyDetail = undefined;
            vm.showPayMethod = false;
        }

        /**
         * @description
         * initializes formatted destination
         */
        function getDestination() {
            if (vm.isAirCare) {
                return $q.when('');
            }

            var deferredDestination = $q.defer();
            var destination = '';
            if (vm.policyDetail.destinationCity) {
                destination = vm.policyDetail.destinationCity + ', ';
            }

            lookupDataService.getCountryByCode(vm.policyDetail.destinationCountry).then(function (countryCode) {
                if (countryCode) {
                    destination + countryCode.name;
                }
                else {
                    destination = countryCode;
                }

                deferredDestination.resolve(destination);
            });

            return deferredDestination.promise;
        }

        /**
         * @description
         * retrieves primary traveler's coverages from given list of passengers
         */
        function getCoveragesOfPrimaryHolder(travelers) {
            var coverages = { all: [], included: [], optional: [] };

            if (!travelers || !travelers.length) return coverages;

            vm.primaryTraveler = travelers.filter(function (traveler) {
                return traveler.isPrimary;
            })[0];

            coverages.all = vm.primaryTraveler.coverages;

            coverages.included = vm.primaryTraveler.coverages.filter(function (coverage) {
                return coverage.type == "Standard" || coverage.type == "Extra";
            });

            coverages.optional = vm.primaryTraveler.coverages.filter(function (coverage) {
                return coverage.type == "Optional" || coverage.type == "Upgrade";
            });
            return coverages;
        }

        /**
         * @description
         * gets display strings for the flights (display needs to show the local time for the airport)
         */
        function getFlightDisplayStrings(flights) {
            if (flights == null || flights.length == 0) {
                return flights;
            }
            for (var i = 0; i < flights.length; i++) {
                flights[i].departureDate = utilService.getLocalDateDisplayString(flights[i].localDepartureDate);
            }
            return flights;
        }

        /**
         * @description
         * sets payment method for display
         */
        vm.getPaymentMethod = function (method) {
            if (method && (method.toLowerCase() == 'cc' || method.toLowerCase() == 'credit card')) {
                return 'Credit Card';
            }
            return method;
        }
       
        /**
        * @description
        * grid implementation - cancel Policy
        */
        vm.showCancelPolicyModal = function (policyDetails) {
            policiesService.confirmCancelPolicy(
                policyDetails,
                function (result) {
                    init();
                });
        }

        vm.editPolicy = function (policy) {
            $state.go('policiesEdit', { policyNumber: policy.policyNumber });
        }

        vm.resendPolicyDocs = function (policyDetail) {
            policiesService.resendPolicyDocs(policyDetail);
        }

        vm.getSubtitle = function (packageId) {
            for (var i = 0; i < vm.packages.length; i++) {
                if (vm.packages[i].id == packageId && vm.packages[i].subTitle != null) {
                    return vm.packages[i].subTitle;
                }
            }
        }

        vm.goToPolicyDocuments = function goToPolicyDocuments() {
            $window.open(vm.policyDetail.policyDocumentLink, '_blank');
        }

        vm.goToFnol = function goToFnol() {
            $state.go('fnol', { policyNumber: vm.policyNumber });
        };

        function hideEditCancelPolicy() {
            if (vm.transactions.payments) {
                for (var i = 0; i < vm.transactions.payments.length; i++) {
                    var currentTransaction = vm.transactions.payments[i];
                    if (currentTransaction && (currentTransaction.method.toLowerCase() === paymentMethods.prepaid || currentTransaction.method.toLowerCase() === paymentMethods.invoice)) {
                        vm.policyDetail.canBeCancelled = false;
                        vm.policyDetail.canBeEdited = false;
                        break;
                    }
                }
            }
        }

        init();
    }
})();