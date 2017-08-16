(function () {
    'use strict';

    /**
     * @ngdoc factory
     * @name aircareService
     *
     * # aircareService
     *
     * @description
     * API integration for aircare purchase module
     */

    angular.module('agentPortal')
        .factory('aircareService', ['portalService', '$resource', 'quotesService', 'settings', 'utilService', aircareService]);

    var packageInformationForStateUrl = "/APIProxy/products/package/:packageId/:state";
    var getPriceUrl = "/APIProxyV2/quotes/performquote"; // *
    var convertQuoteUrl = "/APIProxy/quotes/:quoteId/convert";
    var saveQuoteUrl = "/APIProxy/agents/:agentId/quotes";
    var checkEligibilityUrl = "/APIProxy/quotes/:quoteId/checkeligibility";
    var paymentUrl = "/APIProxy/agents/:agentId/quotes/:quoteId/purchasequote?agentCode=:agentCode"; // *

    function aircareService(portalService, $resource, quotesService, settings, utilService) {

        return {
            getPackageInformationForState: getPackageInformationForState,
            getPrice: getPrice,
            convertQuote: convertQuote,
            saveQuote: saveQuote,
            checkEligibility: checkEligibility,
            processPayment: processPayment,
            deleteSavedQuote: deleteSavedQuote
        };

        /**
         * @description
         * builds a quote model for pricing a quote
         */
        function buildQuotePricingModel(purchaseData) {
            var postBody = {};
            postBody.packageId = purchaseData.packageId;
            postBody.quickQuote = true;
            postBody.residenceState = purchaseData.traveler.state;
            postBody.residenceCountry = 'US';
            postBody.flightLegs = [];

            postBody.fulfillmentMethod = purchaseData.traveler.noEmailAddress ? 'USPS' : 'Email';

            if (purchaseData.destinationCountry !== null) {
                postBody.destinationCountry = purchaseData.destinationCountry;
            }

            if (purchaseData.quote != null) {
                //postBody.PreviousVersionId = purchaseData.quote.policy.quoteId;
                postBody.quoteNumber = purchaseData.quote.policy.quoteNumber;
            } else if (purchaseData.generatedQuote != null) {
                postBody.quoteNumber = purchaseData.generatedQuote.policy.quoteNumber;
            }

            for (var i = 0; i < purchaseData.flights.length; i++) {
                if (purchaseData.flights[i].flightInfo != null) {
                    postBody.flightLegs.push(purchaseData.flights[i].flightInfo);
                }
            }

            if (purchaseData.policyBuyer && purchaseData.policyBuyer.firstName && purchaseData.policyBuyer.lastName) {
                var policyBuyer = purchaseData.policyBuyer;
                policyBuyer.pAccount = {
                    firstName: policyBuyer.firstName,
                    lastName: policyBuyer.lastName,
                    email: policyBuyer.emailAddress,
                    phoneNumber: policyBuyer.phoneNumber,
                    address1: policyBuyer.address.address1,
                    address2: policyBuyer.address.address2,
                    city: policyBuyer.address.city,
                    zip: policyBuyer.address.postalCode,
                    dateOfBirth: policyBuyer.dateOfBirth
                };

                postBody.policyBuyer = policyBuyer;
            }

            postBody.travelers = [];
            var traveler = purchaseData.traveler;
            postBody.primaryTraveler = traveler.customerId;

            // looks like this is for the primary traveler...
            postBody.travelers.push({
                firstName: traveler.firstName,
                lastName: traveler.lastName,
                dateOfBirth: moment(traveler.dateOfBirth).format("MM/DD/YYYY"),
                isPrimary: true,
                salesForceId: traveler.customerId,
                coverages: purchaseData.coverages,
                pAccount: {
                    firstName: traveler.firstName,
                    lastName: traveler.lastName,
                    email: traveler.emailAddress,
                    state: traveler.state,
                    dateOfBirth: moment(traveler.dateOfBirth).format("MM/DD/YYYY"),
                    phoneNumber: traveler.phoneNumber,
                    address1: traveler.address ? traveler.address.address1 : null,
                    address2: traveler.address ? traveler.address.address2 : null,
                    city: traveler.address ? traveler.address.city : null,
                    zip: traveler.address ? traveler.address.postalCode : null,
                    country: 'US'
                }
            });

            // and this looks like it is for additional travelers...
            for (var i = 0; i < purchaseData.travelers.length; i++) {
                traveler = purchaseData.travelers[i];
                postBody.travelers.push({
                    firstName: traveler.firstName,
                    lastName: traveler.lastName,
                    dateOfBirth: moment(traveler.dateOfBirth).format("MM/DD/YYYY"),
                    isPrimary: false,
                    coverages: purchaseData.coverages
                });
            }

            // copy over acknowledgements
            postBody.acknowledgements = purchaseData.acknowledgements;

            return postBody;
        }

        /**
        * @description
        * gets fresh price by getting fresh clarion quote
        */
        function getPrice(purchaseData) {
            var api = $resource(getPriceUrl, {},
                                            { getPrice: { method: 'POST' } });
            var postBody = buildQuotePricingModel(purchaseData);
            return api.getPrice(postBody).$promise;
        }

        /**
        * @description
        * checks eligibility of the quote
        */
        function checkEligibility(quote) {
            var quoteId = null;
            if (quote.id != null) {
                quoteId = quote.id;
            }
            else if (quote.policy != null) {
                quoteId = quote.policy.quoteId;
            } 
            else {
                console.warn("Failed to retrieve quote ID from quote for eligibility check");
            }
            var api = $resource(checkEligibilityUrl, { quoteId: quoteId },
                                           { checkEligibility: { method: 'GET' } });
            return api.checkEligibility().$promise;
        }


        /**
        * @description
        * converts clarion quote into salesforce quote format
        * which is required in order to be able to save the quote into salesforce eventually.
        */
        function convertQuote(purchaseData) {
            var api = $resource(convertQuoteUrl, { quoteId: purchaseData.priceQuote.id },
                                           { convertQuote: { method: 'POST' } });
            var postBody = purchaseData.priceQuote;
            return api.convertQuote(postBody).$promise;
        }


        /**
        * @description
        * saves the quote in salesforce database
        */
        function saveQuote(purchaseData) {
            var api = $resource(saveQuoteUrl, { agentId: purchaseData.agentCode },
                                           { saveQuote: { method: 'POST' } });
            var postBody = purchaseData.convertedPriceQuote;
            postBody.policy.agentCode = purchaseData.agentCode;

            var primaryTraveler = $.grep(postBody.travelers, function (traveler) {
                return traveler.isPrimary;
            })[0];

            if (!primaryTraveler.accountInformation) {
                primaryTraveler.accountInformation = {};
            }
            if (!primaryTraveler.accountInformation.address) {
                primaryTraveler.accountInformation.address = {};
            }

            primaryTraveler.accountInformation.address = loadTravelerAddress(primaryTraveler.accountInformation.address, purchaseData.traveler.address);

            var accountAddress = primaryTraveler.accountInformation.address;
            accountAddress.country = 'US';

            postBody.policy.policyAddress = accountAddress;

            return api.saveQuote(postBody).$promise;
        }

        function loadTravelerAddress(target, source) {
            if (target && source) {
                target.address1 = source.address1;
                target.address2 = source.address2;
                target.city = source.city
                target.stateOrProvince = source.state ? source.state : target.stateOrProvince;
                target.postalCode = source.postalCode;
            }

            return target;
        }

        /**
        * @description
        * processes the payment 
        */
        function processPayment(purchaseData) {
            var quote = null;
            if (purchaseData.generatedQuote != null) {
                quote = purchaseData.generatedQuote;
            } else if (purchaseData.quote != null) {
                quote = purchaseData.quote;
            }

            return portalService.getAgentByInternalId().then(function (agent) {
                var processPaymentApi = $resource(paymentUrl, { agentId: agent.agentId, quoteId: quote.policy.quoteId, agentCode: purchaseData.agentCode },
                                           { processPayment: { method: 'POST' } });
                var quoteId = null;
                if (purchaseData.generatedQuote != null) {
                    quoteId = purchaseData.generatedQuote.policy.quoteId;
                } else if (purchaseData.quote != null) {
                    quoteId = purchaseData.quote.policy.quoteId;
                }

                var postBody = {
                    quoteId: quoteId,
                    overwriteAgent: purchaseData.overwriteAgent,
                    billTo: purchaseData.billing
                }; 
                return processPaymentApi.processPayment(postBody).$promise;
            });
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
         * soft delete the passed in quote
         */
        function deleteSavedQuote(quoteId) {
            quotesService.removeQuotes([quoteId]).then(function () { }, function (error) {
                console.warn("There was an error deleting complete care quote - " + quoteId);
                console.warn(error);
            });
        }
    }
})();

