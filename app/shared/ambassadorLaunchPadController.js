(function () {
    'use strict';

    var agentPortal = angular.module('agentPortal');

    /**
     * @ngdoc controller
     * @name rootController
     *
     * # ambassadorLaunchpadController
     *
     * @description
     * root controller is parent controller of all the other controllers and gets injected as top-most
     * controller, provides functions to initialize items that belog on rootScope
     */

    agentPortal.controller('ambassadorLaunchpadController', ['ambassadorInformationSessionStorage', '$stateParams', 'authenticationNavigationService', ambassadorLaunchpadController]);

    function ambassadorLaunchpadController(ambassadorInformationSessionStorage, $stateParams, authenticationNavigationService) {

        var vm = this;

        function init() {
            ambassadorInformationSessionStorage.clearSessionData();
            authenticationNavigationService.redirectAmbassadorForAction($stateParams);
        };

        init();
    }

})();

