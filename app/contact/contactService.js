(function () {
    'use strict';

    var id = 'contactService';

    /**
     * @ngdoc factory
     * @name contactService
     *
     * # contactService
     *
     * @description
     * provides backend API integration for contact us page 
     */

    angular.module('agentPortal').factory(id, ['$http', '$resource', '$q', 'portalService', contactService]);

    function contactService($http, $resource, $q, portalService) {
        return {
            loadCategoryInfo: getContactOptions,
            sendContactRequest: sendContact,
            getContacts: getContacts
        };


        /**
         * @description
         * retrieves the static contacts from the API
         */
        function getContacts() {
            return $resource("/APIProxy/content/AgentContactInformation", {}).query().$promise;
        }


        /**
         * @description
         * retrieves the question type categories for the list box.
         */
        function getContactOptions() {
            var deferred = $q.defer();

            var uri = '/APIProxy/Content/AgentsContactUs';

            $http.get(uri).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        /**
         * @description
         * posts the filled-contact-us form to server which in turn sends email to concerned parties.
         */
        function sendContact(option, text) {
            var deferred = $q.defer();

            var uri = '/APIProxy/ContactUs';

            portalService.getAgentByInternalId().then(function (agent) {
                var u = agent;

                var content = {
                    Name: u.firstName + ' ' + u.lastName,
                    Email: u.emailAddress,
                    QuestionType: option,
                    Message: text
                };

                $http.post(uri, content).then(function () {
                    deferred.resolve();
                });
            });
            
            return deferred.promise;
        }
    }
})();