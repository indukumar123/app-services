(function() {
    'use strict';

    var serviceId = 'todoService';

    /**
     * @ngdoc factory
     * @name todoService
     *
     * # todoService
     *
     * @description
     * API integration to support TODOs functionality on the dashbaord page
     */
    angular.module('agentPortal').factory(serviceId, ['$http', '$resource', '$q', 'portalService', todoService]);

    function todoService($http, $resource, $q, portalService) {

        return {
            getTodos: getTodos,
            postCompleted: postCompletedTask
        };

        /**
         * @description
         * loads TODOs from the database
         */
        function getTodos() {
            var deferred = $q.defer();

            portalService.getAgentByInternalId().then(function (agent) {
                var url = '/APIProxy/Agents/' + agent.agentId + '/Tasks?packageId=null';

                $http.get(url)
                    .then(function (result) {
                        deferred.resolve(result.data);
                    });
            });

            return deferred.promise;
        }
        
        /**
         * @description
         * marks given TODOItem as completed by making call to server
         */
        function postCompletedTask(id) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var url = '/APIProxy/Agents/' + agent.agentId + '/Tasks/:taskId';
                var api = $resource(url, { taskId: id },
                                                { markComplete: { method: 'POST' } });
                return api.markComplete({ CompletedDate: moment().format("YYYY-MM-DD") }).$promise;
            });
        }

    }
})();