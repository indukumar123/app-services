(function() {
    'use strict';

    angular.module('agentPortal')
        .factory('lookupDataService', ['$resource', '$q', 'portalService', lookupDataService]);

    /**
    * @ngdoc controller
    * @name lookupDataService
    *
    * # lookupDataService
    *
    * @description
    * service to fetch lookup data from server
    */
    function lookupDataService($resource, $q, portalService) {
        var travelerRelationTypesUrl = "/APIProxy/content/relationshiptypes";
        var travelerRelationTypesRuleUrl = "/APIProxy/relationshiptype/getrelationshiptypes/:packageId/:state";
        var airlineUrl = '/APIProxy/provider/airline/:query';
        var tourOperatorUrl = '/APIProxy/provider/tour operator/:query';
        var cruiseLineUrl = '/APIProxy/provider/cruise/:query';
        var hotelUrl = '/APIProxy/provider/hotel/:query';
        var carRentalCompanyUrl = '/APIProxy/provider/car and truck rental/:query';
        var rentalCompanyUrl = '/APIProxy/provider/rental company/:query';
        var countryUrl = '/APIProxy/country/:query';
        var policyPackageRulesetUrl = '/APIProxy/policies/package/:packageId/ruleset';

        /**
         * @description
         * public functions exposed by this service
         */
        return {
            getTravelerRelationTypes: getTravelerRelationTypes,
            getTravelerRelationTypesRule: getTravelerRelationTypesRule,
            lookupDataUrl: lookupDataUrl,
            getProviderInfo: getProviderInfo,
            getCountryByCode: getCountryByCode,
            loadPolicyPackageRuleset: loadPolicyPackageRuleset,
            parseRules: parseRules
        };

        /**
         * @description
         * gets the urls needed for typeaheads/autocomplete of various provider types.
         */
        function lookupDataUrl() {
            return {
                airline: airlineUrl,
                tourOperator: tourOperatorUrl,
                cruiseLine: cruiseLineUrl,
                hotel: hotelUrl,
                carRentalCompany: carRentalCompanyUrl,
                rentalCompany: rentalCompanyUrl,
                country: countryUrl
            };
        }

        /**
         * @description
         * gets the provider information for the specified provider type and search text.
         */
        function getProviderInfo(providerUrl, providerText) {
            if (!providerText || providerText == '')
                return $q.defer().resolve(null);
            return $resource(providerUrl, { query: providerText.replace('&', '') }).query().$promise;
        }

        /**
         * @description
         * gets the possible relation types for additional travelers.
         */
        function getTravelerRelationTypes() {
            return $resource(travelerRelationTypesUrl).query();
        }

        /**
         * @description
         * gets the possible relation types for additional travelers.
         */
        function getTravelerRelationTypesRule(packageId, state, success, error) {
            var blockedRelationshipTypes = $resource(travelerRelationTypesRuleUrl, {}, { get: { method: 'get', isArray: true } });
            //return $resource(travelerRelationTypesUrl).query();
            var result = blockedRelationshipTypes.query({ packageId: packageId, state: state }, function () {
                if (success) {
                    success(result);
                }
            }, error);
            return result;
        }

        /**
         * @description
         * looks up country by given country-code
         */
        function getCountryByCode(countryCode) {
            return portalService.loadCountries().then(function (countries) {
                var matches = $.grep(countries, function (country) { return country.isoCode2 == countryCode; });
                if (matches && matches.length == 1)
                    return matches[0];
                return null;
            });
        }

        /**
         * @description
         * retrieves the package ruleset from the service
         */
        function loadPolicyPackageRuleset(packageId) {
            var deferredPromise = $q.defer();

            $resource(policyPackageRulesetUrl, { packageId: packageId }).get().$promise.then(function (results) {
                deferredPromise.resolve(results);
            }, function (error) {
                deferredPromise.reject(error);
            });

            return deferredPromise.promise;
        };

        /**
      * @description
     * parses the rules from the response and puts them in an easily consumable format for angular
     */
        function parseRules(rawRules) {
            var rules = {
                policy: {
                    req: {
                    }, edit: {}
                },
                traveler: {
                    req: {}, edit: {},
                    primary: {
                        req: {}, edit: {},
                    }
                }
            };

            if (rawRules.required) {
                if (rawRules.required.policy__c && rawRules.required.policy__c.selected) {
                    for (var key in rawRules.required.policy__c.selected) {
                        var apiName = makeFirstLetterLowerCase(rawRules.required.policy__c.selected[key].apiName);
                        if (apiName !== undefined) {
                            rules.policy.req[apiName] = true;
                        }
                    }
                }
                if (rawRules.required.traveler__c && rawRules.required.traveler__c.selected) {
                    for (var key in rawRules.required.traveler__c.selected) {
                        var apiName = makeFirstLetterLowerCase(rawRules.required.traveler__c.selected[key].apiName);
                        if (apiName !== undefined) {
                            rules.traveler.req[apiName] = true;
                        }
                    }
                }
                if (rawRules.required.account && rawRules.required.account.selected) {
                    for (var key in rawRules.required.account.selected) {
                        var apiName = makeFirstLetterLowerCase(rawRules.required.account.selected[key].apiName);
                        if (apiName !== undefined) {
                            rules.traveler.primary.req[apiName] = true;
                        }
                    }
                }
            }
            if (rawRules.editable) {
                if (rawRules.editable.policy__c && rawRules.editable.policy__c.nonSelected) {
                    for (var key in rawRules.editable.policy__c.nonSelected) {
                        var apiName = makeFirstLetterLowerCase(rawRules.editable.policy__c.nonSelected[key].apiName);
                        if (apiName !== undefined) {
                            rules.policy.edit[apiName] = false;
                        }
                    }
                }

                if (rawRules.editable.traveler__c) {
                    if (rawRules.editable.traveler__c.nonSelected) {
                        for (var key in rawRules.editable.traveler__c.nonSelected) {
                            var apiName = makeFirstLetterLowerCase(rawRules.editable.traveler__c.nonSelected[key].apiName);
                            if (apiName !== undefined) {
                                rules.traveler.edit[apiName] = false;
                            }
                        }
                    }
                    // If travelers cannot be both added and removed, Any traveler fields that 
                    // would normally be allowed to be editted are disabled
                    if ((rules.canAddTravelers == false || rules.canRemoveTravelers == false) && rawRules.editable.traveler__c.selected) {
                        for (var key in rawRules.editable.traveler__c.selected) {
                            var apiName = makeFirstLetterLowerCase(rawRules.editable.traveler__c.selected[key].apiName);
                            if (apiName !== undefined) {
                                rules.traveler.edit[apiName] = false;
                            }
                        }
                    }
                }

                if (rawRules.editable.account && rawRules.editable.account.nonSelected) {
                    for (var key in rawRules.editable.account.nonSelected) {
                        var apiName = makeFirstLetterLowerCase(rawRules.editable.account.nonSelected[key].apiName);
                        if (apiName !== undefined) {
                            rules.traveler.primary.edit[apiName] = false;
                        }
                    }
                }
            }

            return rules;
        }

        /**
        * @description
        * makes the first character of a string lower case
        */
        function makeFirstLetterLowerCase(rawText) {
            var firstLetter = rawText.substring(0, 1).toLowerCase();
            return firstLetter + rawText.substring(1);
        }

    }
})();