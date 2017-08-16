(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('agentInformationService', agentInformationService);

    agentInformationService.$inject = ['portalService', 'auth', '$resource', '$q', 'intentService'];

    function agentInformationService(portalService, auth, $resource, $q, intentService) {
        var service = {
            loadAgentInformation: loadAgentInformation
        };

        return service;

        function loadAgentInformation(showlabels) {
            if (showlabels == null) {
                showlabels = true;
            }

            return portalService.loadConfig().then(function (config) {
                //Now get the agent's profile from agent service!
                if (showlabels) {
                    intentService.setIntent("Authorizing...");
                }

                if (auth.profile) {
                    return portalService.initializeAgent(auth.profile.user_id).then(function (agent) {
                        if (agent.agentId) {
                            var agentData = { agent: agent, config: config };
                            var promises = [];
                            promises.push(updateTimezone(agent));
                            return $q.all(promises).then(function() {
                                intentService.resetIntent();
                                return agentData;
                            });
                        } else {
                            intentService.resetIntent();
                        }
                    }, function (error) {
                        intentService.resetIntent();
                        console.warn("Failed while retreiving agent information %o", error);
                    });
                }
            }, function (error) {
                intentService.resetIntent();
                console.warn("Failed while loading configuration %o", error);
            });
        }

        function updateTimezone(agent) {
            var timezoneUpdateUrl = "/APIProxy/agents/updatetimezone/:agentId/:timezone";
            var updateTimezoneApi = $resource(timezoneUpdateUrl, { agentId: agent.agentId, timezone: jstz.determine().name().replace("/", "_") },
                                           { updateTimezone: { method: 'PATCH' } });
            return updateTimezoneApi.updateTimezone().$promise;
        }
    }

})();
