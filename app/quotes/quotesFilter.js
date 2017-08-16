(function () {
    'use strict';

    /**
     * @ngdoc filter
     * @name qutoesFilter
     *
     * # qutoesFilter
     *
     * @description
     * custom filter for supporting the search function on the quotes grid
     */
    angular.module('agentPortal')
        .filter('quotesFilter', ['utilService', quotesFilter]);

    function quotesFilter(utilService) {
        return function (quotes, filterConfig) {
            var matches = [];
            var dateSelected = {
                startDate: null,
                endDate: null
            }
            var filterValue = filterConfig.text.toLowerCase();
            var packageId = filterConfig.packageId;

            var dateRange = utilService.getDateRange(filterConfig.date);

            if (dateRange != null) {
                dateSelected = {
                    startDate: dateRange.startDate.format('MM/DD/YYYY'),
                    endDate: dateRange.endDate.format('MM/DD/YYYY')
                }
            }
           
            for (var i = 0; i < quotes.length; i++) {
                var quote = quotes[i];
                if (quote.subTitle && quote.packageName.indexOf(' ') < 0) {
                    quote.packageName = quote.packageName + " " + quote.subTitle
                }
                //perform matching based on quoteId, policyHolder's name, quote's package name, dates etc.
                if (utilService.isMatchingAny([quote.quoteId.toString(), quote.policyHolderName, quote.destinationCountry], filterValue)
                    && utilService.isMatchingAny([quote.packageId.toLowerCase()], packageId.toLowerCase())
                    && (dateRange == null || utilService.isDateInRange(new moment(quote.quoteDate), dateRange.startDate, dateRange.endDate))) {
                    matches.push(quote);
                }
            }

            return {newRows : matches, 
                    dateSelected : dateSelected};
        };
    }
})();