(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('policyEditService', ['$q', '$resource', 'portalService', 'storage', 'utilService', policyEditService]);

    /**
    * @ngdoc controller
    * @name editPolicyService
    *
    * # editPolicyService
    *
    * @description
    * service to support policy edit related functionality - API calls for policy edits
    */
    function policyEditService($q, $resource, portalService, storage, utilService) {
        var steps = [];

        // URLS for policy edit
        var policyForEditUrl = '/APIProxy/agents/:agentId/policy/:policyNumber/edit';
        var combinedQuoteUrl = '/APIProxy/agents/:agentId/quotes/requestcombinedquotes/:quickquote?forEndorsement=true';
        var savePolicyEditQuoteUrl = '/APIProxy/agents/:agentId/policy/:policyNumber/savequote';
        var bindQuoteUrl = "/APIProxy/agents/:agentId/quotes/:quoteId/bind";

        /**
         * @description
         * initializes workflow steps for complete care 
         */
        function init() {
            steps = [
                { id: 0, title: "Edit Policy", description: "Edit Policy", code: "edit" },
                { id: 1, title: "Purchase", description: "Purchase Endorsement", code: "purchase" }
            ];
        };

        init();

        /**
         * @description
         * public functions exposed by this service
         */
        return {
            getSteps: getSteps,
            storeState: storeState,
            loadPolicy: loadPolicy,
            retrieveState: retrieveState,
            getQuote: getQuote,
            saveQuote: saveQuote,
            bindQuote: bindQuote
        };

        /**
         * @description
         * returns the complete care steps
         */
        function getSteps() {
            return steps;
        };

        /**
         * @description
         * retrieves the editPolicyContainer from the service
         */
        function loadPolicy(policyNumber) {
            var deferredPromise = $q.defer();

            portalService.getAgentByInternalId().then(function (agent) {
                $resource(policyForEditUrl, { agentId: agent.agentId, policyNumber: policyNumber }).get().$promise.then(function (results) {
                    utilService.sendPrimaryTravelerToZeroIndex(results.policy.travelers);
                    utilService.sendPrimaryTravelerToZeroIndex(results.quote.travelers);

                    deferredPromise.resolve(results);
                }, function (error) {
                    deferredPromise.reject(error);
                });
            });

            return deferredPromise.promise;
        };

        /**
         * @description
         * retrieves the editPolicyContainer from the service
         */
        function getQuote(quoteData, isQuickQuote) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var quotesApi = $resource(combinedQuoteUrl, { agentId: agent.agentId, quickquote: isQuickQuote }, { getQuote: { method: 'POST', isArray: true } });
                return quotesApi.getQuote([quoteData]).$promise;
            });
        };

        /**
         * @description
         * saves the edit policy quote to salesforce after verifying it
         */
        function saveQuote(quoteData, policyNumber) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var quotesApi = $resource(savePolicyEditQuoteUrl, { agentId: agent.agentId, policyNumber: policyNumber }, { saveQuote: { method: 'POST' } });
                return quotesApi.saveQuote(quoteData).$promise;
            });
        }

        /**
         * @description
         * bind a quote into a policy
         */
        function bindQuote(bindData, quoteId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var quotesApi = $resource(bindQuoteUrl, { agentId: agent.agentId, quoteId: quoteId }, { bindQuote: { method: 'POST' } });
                return quotesApi.bindQuote(bindData).$promise;
            });
        };

        /**
         * @description
         * retrieves the edit policy data from storage
         */
        function retrieveState() {
            return storage.get('policyedit.state');
        };

        /**
         * @description
         * stores the edit policy state in storage
         */
        function storeState(state) {
            storage.set('policyedit.state', state);
        }
    }
})();