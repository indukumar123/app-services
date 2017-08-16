(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('productsTableDataMapper', ['$rootScope', 'settings', 'utilService', 'format', 'packageNames', productsTableDataMapper]);

    /**
    * @ngdoc controller
    * @name productsTableDataMapper
    *
    * # productsTableDataMapper
    *
    * @description
    * mapper to map complete care realted entities from one format to another
    */
    function productsTableDataMapper($rootScope, settings, utilService, format, packageNames) {
        /**
         * @description
         * public functions exposed by this mapper
         */
        return {
            mapFromQuote: mapFromQuote
        };

        /**
         * @description
         * map from server quote object to Partners Quote
         */
        function mapFromQuote(cta, packageData, ratingId) {
            // need to use the partner alias of the package if it exists, else use the package's name
            var packageName = packageData[ratingId].package.alias || packageData[ratingId].package.name;

            if (packageName) {
                packageName = packageName.toLowerCase().replace(/ /g, '');
            }

            var quickQuoteData = {};

            quickQuoteData.packageName = packageName;
            quickQuoteData.departureDate = moment(cta.departureDate).format('MM/DD/YYYY');
            quickQuoteData.returnDate = moment(cta.returnDate).format('MM/DD/YYYY');
            quickQuoteData.destination = cta.destinationCountry.isoCode2;
            quickQuoteData.totalTripCost = cta.primaryTraveler.tripCost;
            quickQuoteData.state = cta.residenceState;

            return quickQuoteData;
        }
    }
})();