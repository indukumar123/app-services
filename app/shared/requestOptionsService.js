(function () {
    var myAppModule = angular.module('agentPortal');

    /**
     * @ngdoc service
     * @name requestOptions
     *
     * # requestOptions
     *
     * @description
     * provides authentication and other request information based on the environment
     */
    myAppModule
        .factory('requestOptions', ['$rootScope', 'auth', 'storage', requestOptions]);
    function requestOptions($rootScope, auth, storage) {
        return {
            getBaseUrl: function() {
                return $rootScope.config.CLIENT_API_BASE_URL;
            },
            getEligibilityBaseUrl: function () {
                return $rootScope.config.CLIENT_ELIGIBILITY_BASE_URL;
            },
            getAuthToken: function () {
                if (auth.idToken) {
                    return auth.idToken;
                }
                else if (storage.get('idToken')) {
                    return storage.get('idToken');
                }

                return null;
            },
            getOrigin: function() {
                return 'Agent';
            },
            getContentType: function() {
                return 'application/json';
            }
        };
    }
})();