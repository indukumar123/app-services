/**
 * @ngdoc filter
 * @name useFilter
 *
 * # useFilter
 *
 * @description
 * Wrapper filter that facilitates usageo of other custom filters specified by their names
 */
(function () {
    'use strict';

    angular.module('agentPortal')
        .filter('useFilter', ['$filter', useFilter]);

    function useFilter($filter) {
        return function () {
            var value = arguments[0];

            var filterName = [].splice.call(arguments, 1, 1)[0];

            if (value==null || value.toString().length==0 || value=='-'  || (!filterName)) return value;

            return $filter(filterName).apply(null, arguments);
        };
    }
})();