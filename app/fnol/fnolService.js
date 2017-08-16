(function () {
    'use strict';

    angular.module('agentPortal')
            .service('fnolService', fnolService);
    fnolService.$inject = ['$http', '$q'];
    function fnolService($http, $q) {
        var vm = this;
        var currentClaim;


        vm.getClaimConfiguration = getClaimConfiguration;
        vm.submitFnolForClaim = submitFnolForClaim;
        vm.formatFnolForClaim = formatFnolForClaim;
        vm.getFraudWarning = getFraudWarning;
        vm.setCurrentClaim = setCurrentClaim;
        vm.getCurrentClaim = getCurrentClaim;

        function getClaimConfiguration(policyNumber) {
            var options = {
                cache: true
            };
            return $http.get(
                '/APIProxyV2/BHTP/clients/v1/claims/configuration/' + policyNumber)
            .then(function handleSuccess(data) {
                var claimConfiguration = parseConfigurationData(data.data.response);
                if (claimConfiguration.flights && claimConfiguration.flights.length > 0) {
                    claimConfiguration = formatFlightsForDisplay(claimConfiguration);
                }
                return claimConfiguration;
            }, function handleError(error) {
                return $q.reject(error.data);
            });
        }

        function submitFnolForClaim(customerId, fnol) {
            return $http.post(
                '/APIProxyV2/Agents/submitfnol/' + customerId, fnol)
                .then(function handleSuccess(data) {
                    if (data.data.isDuplicate) {
                        return $q.reject(data.data);
                    }
                    return data.data;
                }, function handleFailure(error) {
                    return $q.reject(error.data);
                });
        }

        function formatFnolForClaim(fnol) {
            var formattedFnol = {
                policyNumber: fnol.policyNumber,
                postalCode: fnol.postalCode,
                emailAddress: fnol.emailAddress,
                risk: fnol.risk,
                coverage: fnol.coverage.coverageId,
                flight: fnol.flight,
                countryOfLoss: fnol.countryOfLoss,
                cityOfLoss: fnol.cityOfLoss,
                stateProvinceOfLoss: fnol.stateProvinceOfLoss,
                dateTimeOfLoss: fnol.dateOfLoss,
                postalCodeOfLoss: fnol.postalCodeOfLoss,
                locationOfLoss: fnol.locationOfLoss,
                isCruise: fnol.isCruise,
                affectedTravelers: []
            };

            formattedFnol.dateTimeOfLoss = formatDateTimeOfLossForSalesforce(fnol.dateOfLoss);

            if (fnol.coverage.coveredTravelers) {
                for (var i = 0; i < fnol.coverage.coveredTravelers.length; i++) {
                    if (fnol.coverage.coveredTravelers[i].selected) {
                        formattedFnol.affectedTravelers.push(fnol.coverage.coveredTravelers[i].travelerId);
                    }
                }
            }

            return formattedFnol;
        }

        function getFraudWarning(packageRatingId) {
            return $http.get(
                '/APIProxyV2/websitecontent/fraudwarning/' + packageRatingId)
            .then(function handleSuccess(response) {
                return response.data;
            }, function handleError(error) {
                return $q.reject(error.data);
            });
        }

        function setCurrentClaim(claim) {
            currentClaim = claim;
        }

        function getCurrentClaim() {
            return currentClaim;
        }

        function formatFlightsForDisplay(config) {
            for (var i = 0; i < config.flights.length; i++) {
                config.flights[i].displayOption = config.flights[i].departureAirportCode + ' ' + String.fromCharCode("8594") + String.fromCharCode("160") + config.flights[i].arrivalAirportCode + ' ' + ' - ' + config.flights[i].airlineName + ' - ' + config.flights[i].flightNumber;
            }

            return config;
        }

        function parseConfigurationData(response) {
            var coverages = {};

            for (var i = 0; i < response.coverages.length; i++) {
                var coverage = response.coverages[i];
                var riskGroups = [];

                for (var j = 0; j < coverage.risks.length; j++) {
                    if (riskGroups.indexOf(coverage.risks[j].groupName) === -1) {
                        riskGroups.push(coverage.risks[j].groupName);
                    }
                }

                coverages[coverage.coverageId] = {
                    coverageId: coverage.coverageId,
                    description: coverage.description,
                    name: coverage.name,
                    shortName: coverage.shortName,
                    riskGroups: riskGroups,
                    risks: coverage.risks,
                    coveredTravelers: coverage.coveredTravelers,
                    requires: coverage.requires
                };
            }

            response.coverages = coverages;
            return response;
        }

        function formatDateTimeOfLossForSalesforce(date) {

            // This is done here because a SF WF
            // cannot calculate daylight savingstime.
            // source of joy: https://help.salesforce.com/apex/HTViewSolution?id=000005091&language=en_US
            var timeOfLoss = ' 12:00 AM';

            if (moment(date).isDST()) {
                timeOfLoss = ' 12:01 AM';
            }

            date = date + timeOfLoss;

            return moment(date).format("YYYY-MM-DD");
        }
    }
})();