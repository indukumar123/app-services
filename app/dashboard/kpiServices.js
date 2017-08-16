(function () {
    'use strict';
    /**
     * @ngdoc factory
     * @name kpiServices
     *
     * # kpiServices
     *
     * @description
     * API integration for KPI tiles with the backend
     */
    var serviceId = 'kpiServices';

    angular.module('agentPortal').factory(serviceId, ['$http', '$q', 'portalService', kpiservice]);

    function kpiservice($http, $q, portalService) {

        return {
            getKpis: getAgentKpis,
            getKpisAgency: getKpisAgency,
            getKpisCustomAgent: getKpisCustomAgent
        };

        /**
         * @description
         * loads kpi informatino from the server
         */
        function getAgentKpis(fromdate, enddate) {
            var deferred = $q.defer();
            
            portalService.getAgentByInternalId().then(function (agent) {
                //replace after integration with KPIs API;
                var realUrl = '/APIProxy/Agents/' + agent.agentId + '/Metrics?startDate=' + fromdate + '&endDate=' + enddate;
                $http.get(realUrl)
				.then(function (result) {
				    deferred.resolve(result.data);
				});
            });

            return deferred.promise;
        }

        /**
         * @description
         * loads kpi informatino from the server
         */
        function getKpisAgency(fromdate, enddate) {
            var deferred = $q.defer();

            portalService.getAgentByInternalId().then(function (agent) {
                //replace after integration with KPIs API;
                var realUrl = '/APIProxy/Agency/' + agent.agencyId + '/Metrics?startDate=' + fromdate + '&endDate=' + enddate;
                $http.get(realUrl)
				.then(function (result) {
				    deferred.resolve(result.data);
				});
            });

            return deferred.promise;
        }

        /**
         * @description
         * loads kpi informatino from the server
         */
        function getKpisCustomAgent(fromdate, enddate, agentId) {
            var deferred = $q.defer();
            //replace after integration with KPIs API;
            var realUrl = '/APIProxy/Agents/' + agentId + '/Metrics?startDate=' + fromdate + '&endDate=' + enddate;

            $http.get(realUrl)
				.then(function (result) {
				    deferred.resolve(result.data);
				});

            return deferred.promise;
        }
    }
})();