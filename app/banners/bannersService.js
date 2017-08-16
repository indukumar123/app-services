(function () {
    'use strict';

    var id = 'bannersService';

    /**
     * @ngdoc factory
     * @name bannersService
     *
     * # bannersService
     *
     * @description
     * provides backend API integration for banner ads page 
     */

    angular.module('agentPortal').factory(id, ['$http', '$resource', '$q', 'portalService', bannersService]);

    function bannersService($http, $resource, $q, portalService) {
        var bannerAdsUrl = "/APIProxyV2/Agents/:agentId/BannerAds";

        return {
            get: get
        };

        /**
         * @description
         * retrieves the personalized banner ads from the API
         */
        function get() {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(bannerAdsUrl, { cache: true, agentId: agent.agentId }).query().$promise;
            });
        }
    }
})();