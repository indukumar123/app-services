(function() {
    'use strict';

    /**
     * @ngdoc factory
     * @name productService
     *
     * # productService
     *
     * @description
     * API integration for products page with the backend
     */
    angular.module('agentPortal')
        .factory('productService', ['$resource', 'cacheService', productService]);

        var coveragesUrl = '/APIProxy/Content/:packageName';
        var productHeaderUrl = "/APIProxy/Content/ProductPageHeader";
        var getPackageByStateUrl = '/APIProxyV2/agents/:agentId/packages/:state';
 
        function productService($resource, cacheService) {
            return {
                getCoverages: getCoverages,
                getProductsHeader: getProductsHeader,
                getPackageByState: getPackageByState
        };

        /**
         * @description
         * retrieves static header content for the products page
         */
        function getProductsHeader() {
            return $resource(productHeaderUrl, {}).query();
        }

        /**
         * @description
         * retrieves coverages related descriptions for given product
         */
        function getCoverages(packageName) {
            var quotesApi = $resource(coveragesUrl, { packageName: packageName });
            return quotesApi.query({});
        }

        /**
         * @description
         * loads single customer by given id, to show customer details page
         */
        function getPackageByState(state, agent) {
            cacheService.invalidateCaches();
            return $resource(getPackageByStateUrl, { agentId: agent.agentId, state: state }).get().$promise;
        }
    }
})();
