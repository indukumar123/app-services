(function () {
    'use strict';

    /**
     * @ngdoc factory
     * @name faqService
     *
     * # faqService
     *
     * @description
     * backend integration for FQQ page, primariliy loading of FAQ information from APIs
     */
    angular.module('agentPortal').factory('faqService', ['$http', '$q', '$rootScope', faqService]);

    function faqService($http, $q, $rootScope) {
        return {
            getFaqs: getFaqs,
            getFaqsByKey: getFaqsByKey,
            getFaqsByPackageRatingIds: getFaqsByPackageRatingIds,
            getGenralFaqsForAgents: getGenralFaqsForAgents,
            getGenralFaqsForConsumers: getGenralFaqsForConsumers
        };

        function getFaqs() {
            var deferred = $q.defer();

            var uri = '/APIProxy/faq/AgentFAQ';

            $http.get(uri).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function getFaqsByKey(key) {
            var deferred = $q.defer();

            var uri = '/APIProxy/Content/' + key;

            $http.get(uri).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function getFaqsByPackageRatingIds(packageRatingIds) {
            var deferred = $q.defer();

            var queryString = packageRatingIds.join("&rid=");

            var uri = "/APIProxy/faq/packages";

            $http({
                method: 'GET',
                url: uri,
                params: { rid: packageRatingIds }
            }).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function getGenralFaqsForAgents() {
            var deferred = $q.defer();

            var uri = "/APIProxy/faq/agents";

            $http.get(uri).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function getGenralFaqsForConsumers() {
            var deferred = $q.defer();

            var uri = "/APIProxy/faq/consumer";

            $http.get(uri).then(function (data) {
                deferred.resolve(data);
            });

            return deferred.promise;
        }
    }

})();