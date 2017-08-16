(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name logoutController
     *
     * # logoutController
     *
     * @description
     * performs sign-out from auth0.com
     */
   angular.module('agentPortal')
        .controller('logoutController', ['$state', 'auth', 'storage', 'portalService', logoutController]);

    function logoutController($state, auth, storage, portalService) {
        function logout() {
            auth.signout();
            storage.clearAll();
            portalService.logout();
            if ($state.$current.name.indexOf('login') == -1) {
                $state.go('login');
            }
        };

        logout();
    }
})();