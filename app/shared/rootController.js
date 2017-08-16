(function () {
    'use strict';

    var agentPortal = angular.module('agentPortal');

    /**
     * @ngdoc controller
     * @name rootController
     *
     * # rootController
     *
     * @description
     * root controller is parent controller of all the other controllers and gets injected as top-most
     * controller, provides functions to initialize items that belog on rootScope
     */

    agentPortal.controller('rootController', ['$rootScope', '$scope', 'auth', 'portalService', 'storage', '$q', 'ambassadorInformationSessionStorage', rootController]);

    function rootController($rootScope, $scope, auth, portalService, storage, $q, ambassadorInformationSessionStorage) {

        var rootModel = this;
        rootModel.agent = {};
        rootModel.ready = false;

        $rootScope.alerts = [];

        rootModel.isLoggedIn = function () {
            return portalService.getCurrentAgentIsLoggedIn();
        };
        
        rootModel.isAmbassador = function () {
            return portalService.getCurrentAgentIsAmbassador();
        };

        rootModel.isReady = function () {
            return (rootModel.ready && !rootModel.isLoggedIn()) || portalService.getAgentIsInitialized();
        };

        rootModel.getAgent = function () {
            return portalService.getCurrentAgent();
        }

        /**
         * @description
         * initializes agent and configuration information on the root-scope, i.e., upon successful login
         */
        $scope.init = function () {
            portalService.loadConfig().then(function(config){
                $rootScope.config = config;
            });

            if (auth.profile || storage.get('auth')) {
                portalService.initializeAgent().then(function (agent) {
                    rootModel.ready = true;

                    $rootScope.isCustomSession = (window.sessionStorage.getItem("isCustomSession") == 'true');
                });
            }
            else {
                rootModel.ready = true;
            }
        };

        $scope.init();

    }

})();

