(function () {
    var myAppModule = angular.module('agentPortal');

    /**
     * @ngdoc service
     * @name authService
     *
     * # authService
     *
     * @description
     * provides authentication, authorization and initial loading of reference data
     */
    myAppModule
        .factory('authService', ['$rootScope', '$q', '$resource', 'auth', '$http', 'portalService', 'agentInformationService', 'intentService', 'storage', 'serviceSetup', authService]);
    var agentServiceUrl = "/APIProxy/Agents";
    var timezoneUpdateUrl = "/APIProxy/agents/updatetimezone/:agentId/:timezone";
    var changePasswordUrl = "/APIProxy/users/password";

    function authService($rootScope, $q, $resource, auth, $http, portalService, agentInformationService, intentService, storage, serviceSetup) {

        /**
         * @description
         * right after authentication, this method updates timezone for the agent for accurate date processing on subsequent calls
         */
        function updateTimezone(agent) {
            var updateTimezoneApi = $resource(timezoneUpdateUrl, { agentId: agent.agentId, timezone: jstz.determine().name().replace("/", "_") },
                                           { updateTimezone: { method: 'PATCH' } });
            updateTimezoneApi.updateTimezone().$promise.then(
                null, function (error) {
                    intentService.resetIntent();
                    console.warn("Failed while updating timezone information for agent %o", error);
                });
        }

        /**
         * @description
         * right after authentication, this method performs authorization by downloading agent's profile and also calling function to load one-time initial reference data
         */
        function performAuthorizationAndLoad(successCallback, failureCallback, showlabels) {
            if (showlabels == null) {
                showlabels = true;
            }

            agentInformationService.loadAgentInformation(showlabels).then(function (data) {
                successCallback({ agent: data.agent, config: data.config, bhtp: data.bhtp });
            });
        }

        function failedAuthentication(failureCallback) {
            intentService.resetIntent();
            $rootScope.$broadcast('hideOverlay');
            failureCallback("Authentication Failed, Please check credentials and connectivity before trying again.");
        }

        return {

            /**
             * @description
             * actual implementation for auth0.com sign-in
             */
            signin: function (username, password, successCallback, failureCallback) {
                $rootScope.$broadcast('showOverlay');
                intentService.setIntent("Authenticating...");

                auth.signout();
                localStorage.removeItem('idToken');
                localStorage.removeItem('profile');
                auth.signin({
                    connection: 'Username-Password-Authentication',
                    username: username,
                    password: password,
                    sso: false,
                    rememberLastLogin: false,
                    authParams: {
                        scope: 'openid profile'
                    }
                }, function (profile, token) {
                    if (profile.AgentCode && profile.AgentCode.length > 0) {
                        serviceSetup.injectAuthToken(token);
                        localStorage.setItem('idToken', token);
                        localStorage.setItem('profile', JSON.stringify(profile));
                        storage.set('auth', auth);
                        $rootScope.$broadcast('hideOverlay');
                        //authentication with auth0.com successful, lets now get agent's profile and load initial reference data
                        performAuthorizationAndLoad(successCallback, failureCallback, true);
                    }
                    else {
                        failedAuthentication(failureCallback);
                    }
                },
                    function (error) {
                        failedAuthentication(failureCallback);
                    });
            },

            /**
             * @description
             * sends request to reset user's password to auth0.com, which in turn sends user the email for confirming the password-change
             */
            reset: function (username, successCallback, failureCallback) {
                $rootScope.$broadcast('showOverlay');
                auth.reset({
                    //popup: true
                    username: username,
                    connection: 'Username-Password-Authentication',
                    callbackOnLocationHash: false,
                    offline_mode: false,
                    popup: false
                }, function () {
                    $rootScope.$broadcast('hideOverlay');
                    successCallback();
                },
                    function (error) {
                        $rootScope.$broadcast('hideOverlay');
                        failureCallback(error);
                    });
            },

            /**
             * @description
             * sends request to reset user's password to auth0.com, which in turn sends user the email for confirming the password-change
             */
            performReload: function (successCallback, failureCallback) {
                performAuthorizationAndLoad(successCallback, failureCallback, false);
            },

            changePassword: function (oldPassword, newPassword, confirmPassword, success, error) {
                $rootScope.$broadcast('showOverlay');

                var password = $resource(changePasswordUrl, { oldPassword: '@oldPassword', newPassword: '@newPassword', confirmPassword: '@confirmPassword' }, { save: { method: 'POST' } });

                return password.save({ oldPassword: oldPassword, newPassword: newPassword, confirmPassword: confirmPassword },
                function (response) {
                    $rootScope.$broadcast('hideOverlay');
                    if (success) {
                        success(response);
                    }
                },
                function (errorResponse) {
                    $rootScope.$broadcast('hideOverlay');
                    error(errorResponse);
                });
            }
        };
    }
})();