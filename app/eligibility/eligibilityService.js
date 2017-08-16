(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('eligibilityService', eligibilityService);

    eligibilityService.$inject = ['$resource', '$q', '$filter','settings'];

    var packageConfigurationForRatingId = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration/:ratingId';
    var allPackageConfigurations = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration';
    var packageStateConfiguration = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration/:ratingId/State/:stateIso2';

    function eligibilityService($resource, $q, $filter,settings) {
        var service = {
            getPackageConfigurationByRatingId: getPackageConfigurationByRatingId,
            getAllPackageConfigurations: getAllPackageConfigurations,
            getPackageStateConfiguration: getPackageStateConfiguration,
            setPackageStateConfigurationMessages: setPackageStateConfigurationMessages,
        };

        return service;

        /**
        * @description
        * Gets the package configuration for the defined rating id
        */
        function getPackageConfigurationByRatingId(id) {
            var request = $resource(packageConfigurationForRatingId);
            return request.get({ ratingId: id, cache: true }).$promise.then(function (resp) { 
                // success
                return resp;
            });
        }

        /**
        * @descriptions
        * Gets all the available package configurations
        */
        function getAllPackageConfigurations() {
            var request = $resource(allPackageConfigurations);
            return request.get({ cache: true }).$promise.then(function (resp) {
                // success
                return resp;
            });
        }

        /**
        * @descriptions
        * Gets the package state configuration for the defined state and rating id
        * The returned package state configuration will have the combied package configuration defaults as well
        */
        function getPackageStateConfiguration(state, id) {
            if(!state && !id)
            {
                var pscConfig = { maxTravelers: settings.travelers.maxTravelers };
                return pscConfig;
            }
            var request = $resource(packageStateConfiguration, { ratingId: id, stateIso2: '@stateIso2' });
            return request.get({ stateIso2: state, cache: true }).$promise.then(function (resp) {
                // success
                resp.response.maxTravelers = settings.travelers.maxTravelers;
                return resp.response;
            }, function (err) {
                $q.reject(err.message);
            });
        }

        function setPackageStateConfigurationMessages(errors, config) {
            if (config != null) {
                errors.trip.cost.min = "Trip cost cannot be less than " + $filter('currency')(config.minimumTripCost, "$", 0);
                errors.trip.cost.max = "Trip cost should be less than or equal to " + $filter('currency')(config.maximumTripCost, "$", 0) + " per traveler";
                errors.traveler.birthdate.ageMin = "Traveler must be at least " + config.minimumAge + " years old";
                errors.traveler.birthdate.ageMax = "Traveler can not be older than " + config.maximumAge + " years old";
                errors.trip.returnDate.tripLengthMin = "Trip must be at least " + config.minimumTripLength + " days";
                errors.trip.returnDate.tripLengthMax = "Trip can not exceed " + config.maximumTripLength + " days";
                errors.trip.depositDate.daysFromDepositDate = "Deposit date falls outside of " + config.selectedStateName + "'s " + config.daysFromInitialDepositDate + " days limit.";
            }
        }
    }
})();