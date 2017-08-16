(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name quoteDetailController
     *
     * # quoteDetailController
     *
     * @description
     * controller to support interactions for quote details page that shows single quote details
     */
    angular.module('agentPortal')
        .controller( 'quoteDetailController',
            ['$stateParams', '$location', '$modal', 'settings',
                'quotesService', 'aircareService', 'utilService', 'lookupDataService', 'sendQuoteFactory', 'format',
                'portalService', 'intentService', '$q', 'purchaseNavigationService', quoteDetailController]);

    function quoteDetailController($stateParams, $location, $modal, settings, quotesService, aircareService, utilService, lookupDataService, sendQuoteFactory, format, portalService, intentService, $q, purchaseNavigationService) {
        var vm = this;

        vm.quoteId = null;
        vm.quoteNumber = $stateParams.quoteNumber;
        vm.title = '';
        vm.dateFormat = '';

        vm.quoteDetail = {};
        vm.passengers = [];
        vm.coverages = [];
        vm.flights = [];
        vm.quote = null;

        vm.isAirCare = false;
        vm.showCoverageBreakup = false;
        vm.showQuoteNumber = true;
        vm.isEmailQuote = false;

        function init() {
            vm.title = 'Quote ' + vm.quoteNumber;
            vm.dateFormat = settings.date.format;

            portalService.loadProductsAndPackages().then(function (response) {
                vm.products = response.products;
                vm.packages = response.packages;
                vm.loadQuote();
            })
        }

        /**
        * @description
        * loads quote information by given quote number
        */
        vm.loadQuote = function () {
            quotesService.getByNumber(vm.quoteNumber)
                .then(setCurrent)
                .catch(setError);
        };

        /**
         * @description
         * re-routes user to editing for the quote on the purchase path
         */
        vm.editQuote = function () {
            // nav service expects package rating id to be called ratingId
            vm.quoteDetail.ratingId = vm.quoteDetail.packageRatingId;
            purchaseNavigationService.navigateToPurchase(vm.quoteDetail, null, vm.quoteNumber, null);
        };

        /**
         * @description
         * displays dialog box for sending quote via email 
         */
        vm.sendQuote = function (quote) {
            return sendQuoteFactory.sendQuote(quote);
        }

        /**
         * @description
         * performs eligibility check and if succeeds, re-routes user to the purchase path's last step
         * where he can provide payment information to purchase the quote.
         */
        vm.purchaseQuote = function () {
            intentService.setIntent("Verifying Eligibility ...");
            aircareService.checkEligibility(vm.quote).then(function (response) {
                intentService.resetIntent();
                if (response.isEligible) {
                    // $location had to be left because there was no state provided. If this function ever gets called, update it to use $state
                    $location.path("purchase/package/" + vm.quoteDetail.packageId + "/quote/" + vm.quoteId + "/payment");
                } else {
                    vm.handleError(response, "Error while checking trip eligibility.");
                }
            }, function (error) {
                vm.handleError(error, "Error while checking eligibility.");
            });
        };

        /**
         * @descriptions
         * utility method for one-spot error handling 
         */
        vm.handleError = function (error, message) {
            intentService.resetIntent();
            console.warn(message + " %o", error);
            if (error.eligibilityResults != null) {
                var messageTitle = "Eligibility Check Failed";
                var eligibilityMessage = message;
                var eligibilityResults = error.eligibilityResults;
                for (var i = 0; i < eligibilityResults.length; i++) {
                    eligibilityMessage += " " + eligibilityResults[i].message;
                }
                utilService.showPopup(messageTitle, eligibilityMessage);
            } else if (error.exceptionMessage != null) {
                utilService.showPopup("Error", message + " " + error.exceptionMessage);
            } else if (error.message != null) {
                utilService.showPopup("Error", message + " " + error.message);
            } else {
                utilService.showPopup("Error", " " + message);
            }
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
            if ( vm.isAirCare || !vm.policyDetail || !vm.policyDetail.tripCost ) {
                return false;
            }

            return vm.quoteDetail.tripCost && vm.quoteDetail.tripCost > 0;
        };

        vm.getRowIndexClass = function (number) {
            return utilService.isOddIndexNumber(number) ? 'odd' : '';
        };

        vm.getDataRowClass = function (acknowledgements) {
            return acknowledgements && acknowledgements.length ? 'view-acknowledgements-data' : '';
        };

        vm.departureDate = function () {
            if ( !vm.quoteDetail || !vm.quoteDetail.departureDates || !vm.quoteDetail.departureDates.localized ||
                        !vm.quoteDetail.departureDates.localized.dateString) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.quoteDetail.departureDates.localized.dateString ) +
                        ' ' + vm.quoteDetail.departureDates.timeZoneAbbreviation;
        };

        vm.returnDate = function () {
            if ( !vm.quoteDetail || !vm.quoteDetail.returnDates || !vm.quoteDetail.returnDates.localized ||
                        !vm.quoteDetail.returnDates.localized.dateString ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.quoteDetail.returnDates.localized.dateString ) +
                        ' ' + vm.quoteDetail.returnDates.timeZoneAbbreviation;
        };

        vm.rentalCarPickupDate = function () {
            if (!vm.quoteDetail || !vm.quoteDetail.rentalCarPickupDate) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.quoteDetail.rentalCarPickupDate);
        };

        vm.rentalCarReturnDate = function () {
            if (!vm.quoteDetail || !vm.quoteDetail.rentalCarReturnDate) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.quoteDetail.rentalCarReturnDate);
        };

        /**
         * @description
         * initializes currently loaded quote for display
         */
        function setCurrent(result) {
            vm.quote = result;
            vm.quoteId = vm.quote.policy.quoteId;
            vm.showCoverageBreakup = !vm.isAirCare;
            vm.quoteDetail = result.policy;
            vm.passengers = result.travelers;
            vm.primaryTraveler = $.grep(vm.passengers, function (traveler) {
                return traveler.isPrimary == true;
            })[0];

            vm.flights = result.flights;
            // format dates using local date strings
            if (vm.flights && vm.flights.length > 0) {
                for (var i = 0; i < vm.flights.length; i++) {
                    vm.flights[i].departureDate = format.getLocalDateDisplayString(vm.flights[i].localDepartureDate, 'MM/DD/YYYY');
                    vm.flights[i].arrivalDate = format.getLocalDateDisplayString(vm.flights[i].localArrivalDate, 'MM/DD/YYYY');
                }
            }

            vm.coverages = getCoveragesOfPrimaryHolder(vm.passengers);

            var pkg = vm.packages.filter(function (p) {
                return p.id == vm.quoteDetail.packageId;
            })[0];

            vm.isEmailQuote = pkg && pkg.emailQuote && vm.primaryTraveler.email !== null;
            
            vm.isAirCare = utilService.isAircare(result.policy.packageRatingId);

            getDestination().then(function(destination){
                vm.destination = destination;
            });
        }

        /**
       * @description
       * Show Error
       */
        function setError(error) {
            vm.quoteId = null;
            vm.quoteError = error.exceptionMessage;
            vm.showQuoteNumber = false;
        }

        /**
         * @description
         * initializes formatted destination
         */
        function getDestination() {
            if (vm.isAirCare){
                return $q.when('');
            }

            var deferredDestination = $q.defer();
            var destination = '';
            if (vm.quoteDetail.destinationCity) {
                destination = vm.quoteDetail.destinationCity + ', ';
            }
            
            lookupDataService.getCountryByCode(vm.quoteDetail.destinationCountry).then(function (countryCode) {
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
         * retrieves coverages of primary policy holder (traveler) from the list of passengers attached to the quote
         */
        function getCoveragesOfPrimaryHolder(passengers) {
            var coverages = { all: [], included: [], optional: [] };

            if (!passengers || !passengers.length) return coverages;

            var primaryTraveler = passengers.filter(function (traveler) {
                return traveler.isPrimary;
            })[0];

            coverages.all = primaryTraveler.coverages;

            coverages.included = primaryTraveler.coverages.filter(function (coverage) {
                return coverage.type == "Standard" || coverage.type == "Extra";
            });

            coverages.optional = primaryTraveler.coverages.filter(function (coverage) {
                return coverage.type == "Optional" || coverage.type == "Upgrade";
            });
            return coverages;
        }
        
        vm.getSubtitle = function (packageId) {
            for (var i = 0; i < vm.packages.length; i++) {
                if (vm.packages[i].id == packageId && vm.packages[i].subTitle != null) {
                    return vm.packages[i].subTitle;
                }
            }
        }

        init();
    }
})();