(function() {
    'use strict';

    /**
     * @ngdoc filter
     * @name policiesFilter
     *
     * # policiesFilter
     *
     * @description
     * custom filter implementation for filtering policies based on filters specified
     */
    angular.module('agentPortal')
        .filter('policiesFilter', ['utilService', policiesFilter]);

    function policiesFilter(utilService) {
        return function(policies, filterConfig) {
            var matches = [];
            var dateSelected = {
                startDate: null,
                endDate: null
            }

            var filterValue = filterConfig.text.toLowerCase();
            var packageId = filterConfig.packageId;
            var status = filterConfig.status.toLowerCase();

            var dateRange = utilService.getDateRange(filterConfig.date);

            if (dateRange != null) {
                dateSelected = {
                    startDate: dateRange.startDate.format('MM/DD/YYYY'),
                    endDate: dateRange.endDate.format('MM/DD/YYYY')
                }
            }

            for (var i = 0; i < policies.length; i++) {
                var policy = policies[i];
                if (policy.subTitle && policy.packageName.indexOf(' ') < 0) {
                    policy.packageName = policy.packageName + " " + policy.subTitle
                }

                if (utilService.isMatchingAny([policy.policyNumber.toString(), policy.policyHolderName, policy.destinationCountry], filterValue)
                    && utilService.isMatchingAny([policy.packageId], packageId)
                    && utilService.isMatchingAny([policy.status], status)
                    && (dateRange == null || utilService.isDateInRange(new moment(policy.departureDate.localDate), dateRange.startDate, dateRange.endDate))) {
                    matches.push(policy);
                }
            }

            return {
                newRows: matches,
                dateSelected: dateSelected
            };
        };
    }
})();