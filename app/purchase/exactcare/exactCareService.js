(function() {
    'use strict';

    angular.module('agentPortal')
        .factory('exactCareService', ['portalService', '$resource', '$q', 'quotesService', 'exactCareDataMapper', 'utilService', 'quotes', exactCareService]);

    /**
    * @ngdoc controller
    * @name exactCareService
    *
    * # exactCareService
    *
    * @description
    * service to support exactCare related functionality - API calls for exact care
    */
    function exactCareService(portalService, $resource, $q, quotesService, exactCareDataMapper, utilService, quotes) {
        var steps = [];

        var packageInformationForStateUrl = "/APIProxy/products/package/:packageId/:state";
        var getPriceUrl = "/APIProxy/quotes";
        var getQuickQuotePriceUrl = "/APIProxy/quotes/quick";
        var convertQuoteUrl = "/APIProxy/quotes/:quoteId/convert";
        var saveQuoteUrl = "/APIProxy/agents/:agentId/quotes";
        var paymentUrl = "/APIProxy/agents/:agentId/quotes/:quoteId/purchase?agentCode=:agentCode";
        var packageStateConfigURL = "/APIProxy/agents/:agentId/PackageStateConfig/:packageRatingId/:stateCode";

        /**
         * @description
         * initializes workflow steps for complete care 
         */
        function init() {
            steps = [
                { id: 0, title: "Trip Info", description: "Trip Info", code: "quote" },
                { id: 1, title: "Add Coverages", description: "Add Optional Coverages", code: "coverage" },
                { id: 2, title: "Finish Quote", description: "Finish Quote", code: "traveler" },
                { id: 3, title: "Purchase", description: "Purchase ExactCare", code: "purchase" }
            ];
        }

        init();

        /**
         * @description
         * public functions exposed by this service
         */
        return {
            getPackageInformationForState: getPackageInformationForState,
            getSteps: getSteps,
            getQuotePrice: getQuotePrice,
            getQuickQuotePrice: getQuickQuotePrice,
            saveQuote: saveQuote,
            processPayment: processPayment,
            deleteQuote: deleteSavedQuote,
            getPackageStateConfig: getPackageStateConfig,
            getQuickQuoteWithAllCoverages: getQuickQuoteWithAllCoverages
        };

        /**
         * @description
         * returns the complete care steps
         */
        function getSteps() {
            return steps;
        }

        /**
         * @description
         * gets the state information for complete care package.
         */
        function getPackageInformationForState(packageId, state) {
            return $resource(packageInformationForStateUrl, { packageId: packageId, state: state }).get().$promise;
        }

        /**
        * @description
        * fetches price by getting clarion quote without running eligibility checks
        */
        function getQuickQuotePrice(policyData) {
            var quotesApi = $resource(getQuickQuotePriceUrl, {}, { getPrice: { method: 'POST' } });
            return quotesApi.getPrice(exactCareDataMapper.mapToPriceQuote(policyData)).$promise;
        }

        /**
        * @description
        * fetches price by getting clarion quote
        */
        function getQuotePrice(policyData) {
            var quotesApi = $resource(getPriceUrl, {}, { getPrice: { method: 'POST' } });
            return quotesApi.getPrice(exactCareDataMapper.mapToPriceQuote(policyData)).$promise;
        }

        /*
        * @description
        * Gets a quote that returns the premiums of all optional coverages
        */
        function getQuickQuoteWithAllCoverages(policyData) {
            var newQuote = {
                policy: {
                    isQuickQuote: true
                },
                travelers: [],
                coverages: []
            };

            if (policyData && policyData.policy && policyData.policy.primary) {
                newQuote.policy.fulfillmentMethod = policyData.policy.primary.emailAddress ? 'Email' : 'USPS'
            }

            if (policyData.policy) {
                newQuote.policy.packageName = policyData.packageName;
                newQuote.policy.departureDate = policyData.policy.departureDate;
                newQuote.policy.returnDate = policyData.policy.returnDate;
                newQuote.policy.tripDepositDate = policyData.policy.depositDate;
                newQuote.policy.destinationCountry = policyData.policy.destination.country.isoCode2;

                var travelers = []
                if (policyData.policy.primary) {
                    var primaryTraveler = {
                        isPrimary: true,
                        firstName: policyData.policy.primary.firstName,
                        lastName: policyData.policy.primary.lastName,
                        birthDate: policyData.policy.primary.birthDate,
                        tripCost: policyData.policy.primary.tripCost,
                        address: {
                            stateOrProvince: policyData.policy.primary.address.stateOrProvince
                        }
                    };

                    travelers.push(primaryTraveler);
                }

                if (policyData.policy.travelers && policyData.policy.travelers.length > 0) {
                    for (var i = 0; i < policyData.policy.travelers.length; i++) {
                        var currentTraveler = policyData.policy.travelers[i];
                        var traveler = {
                            firstName: currentTraveler.firstName,
                            lastName: currentTraveler.lastName,
                            birthDate: currentTraveler.birthDate,
                            tripCost: currentTraveler.tripCost
                        };

                        travelers.push(traveler);
                    }
                }

                newQuote.travelers = travelers;
            }

            return quotes.getSingleQuote(newQuote, false)
                    .then(function (resp) {
                        return resp;
                    })
                    .catch(function (err) {
                        return err;
                    });
        }

        /**
        * @description
        * converts clarion quote into salesforce quote format
        * which is required in order to be able to save the quote into salesforce eventually.
        */
        function convertQuote(policyData) {
            var api = $resource(convertQuoteUrl, { quoteId: policyData.priceQuote.id },
            { convertQuote: { method: 'POST' } });
            return api.convertQuote(policyData.priceQuote).$promise;
        }

        /**
        * @description
        * save quote by converting the price quote first to a format understood by sales force.
        * delete any existing quote if present on successful save.
        */
        function saveQuote(policyData) {
            var deferredPromise = $q.defer();

            var existingQuoteId = null;
            if (policyData.quote) {
                existingQuoteId = policyData.quote.policy.quoteId;
            }

            var requestId = null;
            if (policyData.requestId && policyData.requestId.length > 0) {
                requestId = policyData.requestId;
            }

            convertQuote(policyData).then(function(response) {
                policyData.convertedPriceQuote = response;
                if (requestId && requestId.length>0) {
                    policyData.convertedPriceQuote.policy.requestId = policyData.requestId;
                }
                actuallySaveQuote(policyData).then(function(saveResponse) {
                    if (saveResponse.policy && existingQuoteId) {
                        //deleteSavedQuote(existingQuoteId);
                    }
                    deferredPromise.resolve(saveResponse);
                }, function(error) {
                    deferredPromise.reject(error);
                });
            }, function(error) {
                deferredPromise.reject(error);
            });

            return deferredPromise.promise;
        }

        /**
        * @description
        * processes the payment 
        */
        function processPayment(policyData) {
            var quoteId = policyData.quote.policy.quoteId;
            return portalService.getAgentByInternalId().then(function (agent) {
                var processPaymentApi = $resource(paymentUrl, { agentId: agent.agentId, agentCode: policyData.quote.policy.agentCode, quoteId: quoteId }, { processPayment: { method: 'POST' } });

                var postBody = {
                    quoteId: quoteId,
                    overwriteAgent: policyData.overwriteAgent,
                    billTo: policyData.billing
                };
                return processPaymentApi.processPayment(postBody).$promise;
            });
        }

        /**
         * @description
         * saves the quote in salesforce database
         */
        function actuallySaveQuote(policyData) {
            policyData.policy.fulfillmentMethod = policyData.policy.primary.emailAddress ? 'Email' : 'USPS'

            var api = $resource(saveQuoteUrl, { agentId: policyData.policy.agentCode }, { saveQuote: { method: 'POST' } });

            return api.saveQuote(exactCareDataMapper.mapToSaveQuoteRequest(policyData)).$promise;
        }

        /**
         * @description
         * soft delete the passed in quote
         */
        function deleteSavedQuote(quoteId) {
            quotesService.removeQuotes([quoteId]).then(function() {}, function(error) {
                console.warn("There was an error deleting complete care quote - " + quoteId);
                console.warn(error);
            });
        }

        /**
       * @description
       * fetches package state config
       */
        function getPackageStateConfig(packageRatingId, state) {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(packageStateConfigURL, { agentId: agent.agentId, packageRatingId: packageRatingId, stateCode: state }).get().$promise;
            });
        }
    }
})();