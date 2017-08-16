(function() {
    'use strict';

    /**
     * @ngdoc filter
     * @name customersFilter
     *
     * # customersFilter
     *
     * @description
     * custom filter to support search function on customers grid
     */
    angular.module('agentPortal')
        .filter('customersFilter', ['utilService', customersFilter]);

    function customersFilter(utilService) {
        return function(customers, filterConfig) {
            var matches = [];
            var dateSelected = {
                startDate: null,
                endDate: null
            }

            var filterValue = filterConfig.text.toLowerCase();

            var dateRange = utilService.getDateRange(filterConfig.date);

            if (dateRange != null) {
                dateSelected = {
                    startDate: dateRange.startDate.format('MM/DD/YYYY'),
                    endDate: dateRange.endDate.format('MM/DD/YYYY')
                }
            }

            for (var i = 0; i < customers.length; i++) {
                var customer = customers[i];

                //perform match by name/email/state as well as date.
                if (utilService.isMatchingAny([customer.name, customer.email, customer.state], filterValue)
                    && (dateRange == null || utilService.isDateInRange(customer.lastPurchaseDate, dateRange.startDate, dateRange.endDate))) {
                    matches.push(customer);
                }
            }
                
            return {
                newRows: matches,
                dateSelected: dateSelected
            };
        };
    }
})();