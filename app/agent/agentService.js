(function() {
    'use strict';

    /**
     * @ngdoc module
     * @name agentService
     *
     * # agentService
     *
     * @description
     * Agent related data retrieval and storage service
     */
    angular.module('agentPortal')
        .factory('agentService', ['$resource', '$q', '$rootScope', 'portalService', agentService]);

    function agentService($resource, $q, $rootScope, portalService) {

        var agentsApi = $resource('/APIProxy/agents', {}, {
            update: { method: 'PUT' },
            get: { method: 'GET', params: { id: '@id' } }
        });
        var queryAgentsPagedUrl = '/APIProxy/agency/:agencyId/getAgents?limit=:pageSize&status=:status&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&pageSize=:pageSize&role=&searchText=:searchText';
        var searchAgentsByNameUrl = $resource('/APIProxyV2/BHTP/clients/v1/agents/name/:searchAgentName', { searchAgentName: '@searchAgentName' }, { get: { method: 'get', isArray: false } });
        var searchAgentsByCodeUrl = $resource('/APIProxyV2/BHTP/clients/v1/agents/code/:searchAgentCode', { searchAgentCode: '@searchAgentCode' }, { get: { method: 'get', isArray: false } });

        return {
            getAgent: getAgent,
            saveAgent: saveAgent,
            getCountries: getCountries,
            getStates: getStates,
            getStatePackages: getStatePackages,
            loadPagedData: loadPagedData,
            getAgentDetail: getAgentDetail,
            saveAgentDetail: saveAgentDetail,
            expireAgent: expireAgent,
            activateAgent: activateAgent,
            fetchAgents: fetchAgents,
            findAgentsByName: findAgentsByName,
            findAgentsByCode: findAgentsByCode
        };

        /**
         * @description
         * retrieves agent
         */
        function getAgent(agentId) {
            return agentsApi.get({ id: agentId });
        }

        /**
         * @description
         * saves agent back to the server
         */
        function saveAgent(agent) {
            return agentsApi.update(null, agent).$promise;
        }

        /**
         * @description
         * retrieves states
         */
        function getStates() {
            return $resource('/APIProxy/states').get();
        }

        /**
         * @description
         * retrieves countries
         */
        function getCountries() {
            return $resource('/APIProxy/country').query();
        }

        /**
         * @description
         * reconciles countries and states to create meta data that will allow
         * us to determine which states agent is allowed to sell product packages.
         */
        function processStatePackageResponse(results) {
            var statePackages = {};
            results.forEach(function(state) {
                statePackages[state.iso2Code] = [];
                if (state.packages) {
                    state.packages.forEach(function (packageElement) {
                        var packageName = packageElement.displayName;
                        if (packageElement.displayNameSubtitle) {
                            packageName = packageName + ' ' + packageElement.displayNameSubtitle;
                        }

                        var canSell = packageElement.canSell && packageElement.hasAgreement && portalService.isPackageAvailable(packageElement);

                        statePackages[state.iso2Code].push({
                            ratingId: packageElement.ratingId,
                            name: packageName,
                            canSell: canSell,
                            title: canSell ? "" : "This policy is not available in the state."
                        });
                    });
                }
            });
            return statePackages;
        }

        /**
         * @description
         * returns packages that agent is allowed to sell 
         */
        function getStatePackages(states) {
            return processStatePackageResponse(states);
        }

        /**
        * @description
        * loads agent from the server
        */
        function loadPagedData(pageNumber, orderBy, direction, status, searchText) {
            return portalService.getAgentByInternalId().then(function (agent) {
                if (!agent.isSuperUser) {
                    return;
                }
                var agentsApi = $resource(queryAgentsPagedUrl, {
                    agencyId: agent.agencyId,
                    pageNumber: pageNumber,
                    orderBy: orderBy,
                    direction: direction,
                    pageSize: $rootScope.config.CLIENT_GRID_PAGE_SIZE,
                    status: status.toLowerCase(),
                    searchText: searchText
                }, { get: { method: 'GET', isArray: false } });
                //return customersApi.query().get.$promise;
                return agentsApi.get().$promise;
            });
        }

        function getAgentDetailApi(agencyId) {
            return $resource('/APIProxy/agency/' + agencyId + '/Agent', {}, {
                insert: { method: 'POST' },
                update: { method: 'PUT' },
                get: { method: 'GET', params: { id: '@id' }, isArray: false }
            });
        }

        /**
         * @description
         * retrieves agent detail
         */
        function getAgentDetail(agentId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var agentsDetailApi = getAgentDetailApi(agent.agencyId);
                return agentsDetailApi.get({ id: agentId });
            });
        }

        /**
         * @description
         * saves agent detail back to the server
         */
        function saveAgentDetail(agent) {
            return portalService.getAgentByInternalId().then(function (loggedInAgent) {
                if (!loggedInAgent.isSuperUser) {
                    return;
                }

                var agentsDetailApi = getAgentDetailApi(loggedInAgent.agencyId);
                if (agent.agentId == null) {
                    return agentsDetailApi.insert(null, agent).$promise;
                }
                else {
                    return agentsDetailApi.update(null, agent).$promise;
                }
            });
        }

        /**
         * @description
         * expire selected agent 
         */
        function expireAgent(agentId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                if (!agent.isSuperUser) {
                    return;
                }
                var expiredAgentApi = '/APIProxy/agency/' + agent.agencyId + '/ExpireAgent?id=' + agentId;
                return $resource(expiredAgentApi).save().$promise;
            });
        }

        /**
        * @description
        * activate selected agent 
        */
        function activateAgent(agentId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                if (!agent.isSuperUser) {
                    return;
                }
                var activateAgentApi = '/APIProxy/agency/' + agent.agencyId + '/ActivateAgent?id=' + agentId;
                return $resource(activateAgentApi).save().$promise;
            });
        }

        function fetchAgents(agencyId) {
            return portalService.loadAgentsForAgency(agencyId).then(function (result) {
                if (result) {
                    //Setting agentName
                    for (var k = 0; k < result.length; k++) {
                        result[k].agentName = result[k].firstName + " " + result[k].lastName;
                    }
                    //Sorting by agentName
                    result.sort(function (a, b) {
                        var nameA = a.agentName.toLowerCase(), nameB = b.agentName.toLowerCase();

                        if (nameA < nameB)
                            return -1;

                        if (nameA > nameB)
                            return 1;

                        return 0;
                    });
                }

                return result;
            });
        }

        function findAgentsByName(loggedInAgentCode, agentName, success, error) {
            var resp = searchAgentsByNameUrl.get({
                searchAgentName: agentName
            }, function () {
                if (success) {
                    success(resp);
                }
            }, error);
            return resp;
        };

        function findAgentsByCode(loggedInAgentCode, agentCode, success, error) {
            var resp = searchAgentsByCodeUrl.get({
                searchAgentCode: agentCode
            }, function () {
                if (success) {
                    success(resp);
                }
            }, error);
            return resp;
        }
    }
})();