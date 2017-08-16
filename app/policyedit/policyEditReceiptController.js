(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name policiesController
     *
     * # policiesController
     *
     * @description
     * controller for policies listing on policies page
     */
    angular.module('agentPortal')
        .controller( 'policyEditReceiptController',
                        ['$stateParams', '$rootScope', 'policyEditDataMapper', 'receiptService',
                            'utilService', '$state', 'format', policyEditReceiptController] );

    function policyEditReceiptController($stateParams, $rootScope, policyEditDataMapper, receiptService, utilService, $state, format) {

        // Settings
        var vm = this;


        vm.departureDate = function () {
            if ( !vm.receipt || !vm.receipt.policy || !vm.receipt.policy.departureDates ||
                        !vm.receipt.policy.departureDates.localized || !vm.receipt.policy.departureDates.localized.dateString ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.receipt.policy.departureDates.localized.dateString ) +
                        ' ' + vm.receipt.policy.departureDates.timeZoneAbbreviation;
        };

        vm.returnDate = function () {
            if ( !vm.receipt || !vm.receipt.policy || !vm.receipt.policy.returnDates ||
                        !vm.receipt.policy.returnDates.localized || !vm.receipt.policy.returnDates.localized.dateString ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.receipt.policy.returnDates.localized.dateString ) +
                        ' ' + vm.receipt.policy.returnDates.timeZoneAbbreviation;
        };

        /**
        * @description
        * set the route params to vm properties, kick off other initialization
        */
        function init() {
            vm.policyNumber = $stateParams.policyNumber;
            vm.state = receiptService.retrieveReceiptState();
            vm.receipt = vm.state.policy;

            for (var i = 0; i < vm.receipt.flights.length; i++) {
                vm.receipt.flights[i].departureDate = utilService.getLocalDateDisplayString(vm.receipt.flights[i].localDepartureDate);
            }

            policyEditDataMapper.setPrimaryTravelerCoverages(vm.receipt.travelers); //uses 0 index
            var tripCost = vm.receipt.policy.tripCost;
            //if (vm.receipt.policy.tripCost > 0 && !vm.receipt.policy.totalTripCostProvided && vm.receipt.travelers.length > 0) {
            //    tripCost = vm.receipt.policy.tripCost * vm.receipt.travelers.length;
            //}
            policyEditDataMapper.formatCoverageListPrices(vm.receipt.travelers[0].coverages, tripCost);
        };

        /**
         * Returns flag indicating the current package is AirCare
         */
        vm.isAirCare = function () {
            return vm.receipt.policy.productRatingId === '1';
        };

        /**
         * Returns flag indicating the current package is ExactCare
         */
        vm.isExactCare = function () {
            return vm.receipt.policy.productRatingId === '2';
        };

        /**
         * @description
         * Navigate to policy view page after purchase.
         */
        vm.navigateToPolicyViewFromReceipt = function () {
            $state.go('policiesView', { policyNumber: vm.policyNumber });
        };

        vm.getOptionalCoverageDisplayOrLimit = function (coverage) {
            if (!coverage){
                return null;
            }
            
            if (coverage.ratingId === 'FAU') {
                return coverage.coverageLimit;
            }
            else {
                return coverage.coverageDisplayString;
            }
        };

        vm.getRowIndexClass = function (number) {
            return utilService.isOddIndexNumber(number) ? 'odd' : '';
        };

        vm.getDataRowClass = function (acknowledgements) {
            return acknowledgements && acknowledgements.length ? 'view-acknowledgements-data' : '';
        };

        init();
    }
})();