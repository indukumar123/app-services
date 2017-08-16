(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('policyEditDataMapper', ['$rootScope', 'settings', policyEditDataMapper]);

    /**
    * @ngdoc controller
    * @name policyEditDataMapper
    *
    * # policyEditDataMapper
    *
    * @description
    * mapper to map complete care realted entities from one format to another
    */
    function policyEditDataMapper($rootScope, settings) {
        /**
        * @description
        * public functions exposed by this mapper
        */
        return { 
            mapPolicyToQuote: mapPolicyToQuote,
            setCoverages: setCoverages,
            formatQuotePrices: formatQuotePrices,
            formatCoverageListPrices: formatCoverageListPrices,
            setPrimaryTravelerCoverages: setPrimaryTravelerCoverages
        };

        /**
         * @description
         * initialize the existing policy selections to the new policy quote
         */
        function mapPolicyToQuote(quote, policy) {
            for (var i = 0; i < policy.travelers[0].coverages.length; i++) {
                for (var j = 0; j < quote.package.coverages.length; j++) {

                    if (quote.package.coverages[j].canRemove != false) {
                        quote.package.coverages[j].canRemove = true; //set default if nothing exists
                    }
                    if (policy.travelers[0].coverages[i].ratingId == quote.package.coverages[j].ratingId) {
                        quote.package.coverages[j].selected = true;
                        quote.package.coverages[j].canRemove = policy.travelers[0].coverages[i].canRemoveCoverage;
                        quote.package.coverages[j].coverageLimit = policy.travelers[0].coverages[i].coverageLimit;
                        quote.package.coverages[j].coverageLimitDisplayText = policy.travelers[0].coverages[i].coverageLimitDisplayText;
                        quote.package.coverages[j].percentageLimitofTripCost = policy.travelers[0].coverages[i].percentageLimitofTripCost;
                    }
                }
            }

            quote.policy.tripCost = policy.policy.tripCost;
        }

        /**
        * @description
        * initialization, filters included and optional coverages per quote
        */
        function setCoverages(quote) {
            formatQuotePrices(quote);

                quote.package.includedCoverages = quote.package.coverages.filter(function (coverage) {
                    return coverage.type == "Standard" || coverage.type == "Extra";
                });

                quote.package.optionalCoverages = quote.package.coverages.filter(function (coverage) {
                    return coverage.type == "Optional" || coverage.type == "Upgrade";  // isOptional
                });

        }

        /**
        * @description
        * initialization, filters included and optional coverages per quote
        */
        function setPrimaryTravelerCoverages(travelers) {
            travelers[0].includedCoverages = travelers[0].coverages.filter(function (coverage) {
                return coverage.type == "Standard" || coverage.type == "Extra";
            });

            travelers[0].optionalCoverages = travelers[0].coverages.filter(function (coverage) {
                return coverage.type == "Optional" || coverage.type == "Upgrade" || coverage.type == "Extra Upgrade";  // isOptional
            });
        }

        function getTripCoverages() {
            var TripCoverages = [];
            TripCoverages.push({
                "ratingId": "TC"
            });
            TripCoverages.push({
                "ratingId": "TI"
            });
            TripCoverages.push({
                "ratingId": "TIRA"
            });
            TripCoverages.push({
                "ratingId": "MC"
            });
            TripCoverages.push({
                "ratingId": "TD"
            });
            TripCoverages.push({
                "ratingId": "BPE"
            });
            TripCoverages.push({
                "ratingId": "BD"
            });
            TripCoverages.push({
                "ratingId": "CRCC"
            });
            TripCoverages.push({
                "ratingId": "CFAR"
            });

            return TripCoverages;
        }

        function formatQuotePrices(quote) {
            var TripCoverages = getTripCoverages();
            var tripCost = quote.policy.tripCost ? (
                quote.policy.totalTripCostProvided ? quote.policy.tripCost : quote.policy.tripCost * quote.travelers.length
                ) : 0;
            for (var i = 0; i < quote.package.coverages.length; i++) {
                var coverage = quote.package.coverages[i];
                for (var j = 0; j < TripCoverages.length; j++) {

                    if (coverage.dailyLimit != null && coverage.dailyLimit != undefined) {
                        coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                    } else
                        if (coverage.percentageLimitofTripCost != null && coverage.percentageLimitofTripCost != undefined) {
                            coverage.coverageDisplayString = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(tripCost);
                        } else
                            if (coverage.ratingId == "CRCC") {
                                coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit) + " Per Car";
                            } else {
                                coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit);
                            }
                    break;
                }
                quote.package.coverages[i] = coverage;
            }

            return quote;
        }

        function formatCoverageListPrices(coverages, tripCost) {
            var TripCoverages = getTripCoverages();
            if (!tripCost) { tripCost = 0; }

            for (var i = 0; i < coverages.length; i++) {
                var coverage = coverages[i];
                for (var j = 0; j < TripCoverages.length; j++) {

                    if (coverage.dailyLimit != null && coverage.dailyLimit != undefined) {
                        coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                    } else
                        if (coverage.percentageLimitofTripCost != null && coverage.percentageLimitofTripCost != undefined) {
                            coverage.coverageDisplayString = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(tripCost);
                        } else
                            if (coverage.ratingId == "CRCC") {
                                coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit) + " Per Car";
                            } else {
                                coverage.coverageDisplayString = "$" + commaSeparateNumber(coverage.coverageLimit);
                            }
                    break;
                }
                coverages[i] = coverage;
            }

            return coverages;
        }

        function commaSeparateNumber(inputNumber) {
            inputNumber = inputNumber + "";
            var numberArray = inputNumber.split('');
            var index = -3;
            while (numberArray.length + index > 0) {
                numberArray.splice(index, 0, ',');
                // Decrement by 4 since we just added another unit to the array.
                index -= 4;
            }
            return numberArray.join('');
        }
    }
})();