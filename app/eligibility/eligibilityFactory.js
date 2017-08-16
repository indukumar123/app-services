(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('eligibilityFactory', ['quotesService', 'storage', '$q', 'googletagmanager', 'format', eligibilityFactory]);


    function eligibilityFactory(quotesService, storage, $q, googletagmanager, format) {
        var factory = {
            getByCode: getByCode,
            parseEligibilityResponses: parseEligibilityResponses,
            getEligibleQuotes: getEligibleQuotes
        };

        return factory;

        function getPackageByRatingId(ratingId) {
            return quotesService.getProducts().then(function (products) {
                return products.filter(function (pkg) {
                    if (pkg.ratingId) {
                        return pkg.ratingId == ratingId;
                    }
                })[0];
            });
        }

        function handleRecommendations(errorMessage) {
            switch (errorMessage.code) {
                case '8003':
                    return getRecommendAirCareAbroad(errorMessage);
                    break;
                case '8004':
                    return getRecommendAirCareDomestic(errorMessage);
                    break;
                default:
                    return $q.reject('No error code found for code');
            }
        };

        function getRecommendation(messages) {
            if (!messages) {
                return null;
            }

            for (var i = 0; i < messages.length; i++) {
                switch (messages[i].code) {
                    case '8003':
                    case '8004':
                        return messages[i];
                }
            }

            // recommendation not found.
            return null;
        }

        function getRecommendAirCareDomestic(errorMessage) {
            return getPackageByRatingId(global_domestic_aircare_rating_Id)
                        .then(function (pkg) {
                            return getRecommendationsObject(pkg.name, errorMessage);
                        });
        }

        function getRecommendAirCareAbroad(errorMessage) {
            return getPackageByRatingId(global_abroad_aircare_rating_Id)
                        .then(function (pkg) {
                            return getRecommendationsObject(pkg.name, errorMessage);
                        });
        }

        function getRecommendationsObject(packageName, errorMessage) {
            return {
                '8003': {
                    prompt: 'Would you like to switch to ' + packageName + '?',
                    confirm: 'Yes',
                    dismiss: 'No',
                    action: action2621,
                    apiErrorMessage: errorMessage
                },
                '8004': {
                    prompt: 'Would you like to switch to ' + packageName + '?',
                    confirm: 'Yes',
                    dismiss: 'No',
                    action: action2619,
                    apiErrorMessage: errorMessage
                }
            };
        }

        /**
         * @description
         * retrieves the specified configuration for the error code
         */
        function getByCode(message) {
            return handleRecommendations(message)
                    .then(function (recommendations) {
                        return recommendations[message.code];
                    },
                        function (error) {
                            return null;
                        }
                    );
        }

        /**
         * @description
         * Filters responses from eligibility that should not be customer facing.
         */
        function verifyResponseMessage(messageResponse) {
            var messageOk = true;

            if (messageResponse.indexOf('Trip blocked') > -1) {
                messageOk = false;
            }

            if (messageResponse.indexOf('Eligible Flight') > -1) {
                messageOk = false;
            }

            if (messageResponse.indexOf('but this product does not cover flights outside of the United States') > -1) {
                messageOk = false;
            }

            if (messageResponse.indexOf('This product requires at least one flight that originates from or terminates at an international destination.') > -1) {
                messageOk = false;
            }

            if (messageResponse.indexOf('Try AirCare Abroad') > -1) {
                messageOk = false;
            }

            if (messageResponse.indexOf('Try AirCare') > -1) {
                messageOk = false;
            }

            return messageOk;
        }

        /**
         * @description
         * takes an array of eligibility responses and transforms them into a more easily consumed object
         */
        function parseEligibilityResponses(responses, displayProductSwapPrompts) {
            var deferredResp = $q.defer();

            var eligibilityResponse = {
                messages: [], // [{text, code, type, severity, acknowledgements}]
                recommendation: null, // [{text, code, type, severity}]
            };

            for (var i = 0; i < responses.length; i++) {
                var response = responses[i];
                if (response.tripErrors != null) {
                    for (var j = 0; j < response.tripErrors.length; j++) {
                        if (!isMessageInMessageList(eligibilityResponse.messages, response.tripErrors[j])) {
                            eligibilityResponse.messages.push(response.tripErrors[j])
                        }
                    }
                }
            }

            // see if we need to handle recommendations.
            if (displayProductSwapPrompts && getRecommendation(eligibilityResponse.messages)) {
                var recommendationMessage = getRecommendation(eligibilityResponse.messages);

                getByCode(recommendationMessage)
                    .then(function (recommendation) {
                        eligibilityResponse.recommendation = recommendation;

                        // return the eligibility response.
                        deferredResp.resolve(eligibilityResponse);
                    });
            }
            else {
                deferredResp.resolve(eligibilityResponse);
            }

            return deferredResp.promise;
        }

        function isMessageInMessageList(eligibilityResponse, message) {
            for (var i = 0; i < eligibilityResponse.length; i++) {
                if (eligibilityResponse[i].text === message.text) {
                    // found a duplicate.
                    return true;
                }
            }

            // no duplicates
            return false;
        }

        /**
         * @description
         * takes an array of questes, packagesConfiguration and returns eligible quotes
         */
        function getEligibleQuotes(quote) {
            var pkg = quote.package;
            var packageConfiguration = quote.packageConfiguration;
            var productRules = packageConfiguration.productRules;
            var departureDate = moment(quote.policy.departureDates.localized.dateString, 'YYYY-MM-DD', true);
            var returnDate = moment(quote.policy.returnDates.localized.dateString, 'YYYY-MM-DD', true);

            for (var i = 0; i < quote.travelers.length; i++) {
                var age = moment().diff(quote.travelers[i].birthDate, 'years');
                if ((productRules.minimumAge != null && age < productRules.minimumAge) || (productRules.maximumAge != null && age > productRules.maximumAge)) {
                    // minimumAge or maximumAge Eligibility Failed
                    return false;
                }

                if ((productRules.minimumTripCost != null && quote.travelers[i].tripCost < productRules.minimumTripCost) || (productRules.maximumTripCost != null && quote.travelers[i].tripCost > productRules.maximumTripCost)) {
                    // trip cost eligibility failed
                    return false;
                }
            }

            var tripLength = returnDate.diff(departureDate, 'days');
            if ((productRules.minimumTripLength != null && tripLength < productRules.minimumTripLength) || (productRules.maximumTripLength != null && tripLength > productRules.maximumTripLength)) {
                // TripLength Eligibility Failed
                return false;
            }

            // check for exempt country
            if (productRules.exemptCountries != null) {
                for (var i = 0; i < productRules.exemptCountries.length; i++) {
                    if (quote.policy.destinationCountry.toLowerCase() == productRules.exemptCountries[i].toLowerCase()) {
                        // Country Eligibility Failed
                        return false;
                    }
                }
            }

            return quote;
        }

        //#region Actions
        function action2619(state) {
            getPackageByRatingId(global_domestic_aircare_rating_Id).then(function (domestic) {
                setPackage(state, domestic);
                googletagmanager.aircareAbroadToDomestic(true);
            });
        }

        function action2621(state) {
            getPackageByRatingId(global_abroad_aircare_rating_Id).then(function (abroad) {
                setPackage(state, abroad);
                googletagmanager.aircareDomesticToAbroad(true);
            });
        }

        function setPackage(state, objpackage) {

            state.packageId = objpackage.id;
            state.subTitle = objpackage.subTitle

            storage.set('aircare.state', state);
        }
        //#endregion
    }
})();