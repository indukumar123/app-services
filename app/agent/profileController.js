(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name profileController
     *
     * # profileController
     *
     * @description
     * provides profile related functions on top-navigation bar
     */
    angular.module('agentPortal')
        .controller('profileController', ['$stateParams', '$scope', '$modal', 'settings', '$timeout', '$filter', 'agentService', 'utilService', 'portalService', 'storage', 'intentService', profileController]);

    //.controller('profileController', ['$scope', '$modal', 'settings', '$timeout', '$filter', 'agentService', 'utilService', profileController]);

    function profileController($stateParams, $scope, $modal, settings, $timeout, $filter, agentService, utilService, portalService, storage, intentService) {
        var vm = this;

        vm.title = 'Profile';
        vm.agent = {};
        vm.phoneMask = {};
        vm.editMode = false;
        vm.change = null;
        vm.currentAgent = {};

        /**
         * @description
         * initialization - loads fresh agent information from server
         */
        function init() {
            portalService.getAgentByInternalId().then(function (agent) {
                vm.currentAgent = agent;
                initMasks();

                loadAgent();
                vm.lookup = agentService.getStates();
            });
        };

        /**
         * @description
         * initalizes mask for phone number field
         */
        function initMasks() {
            vm.phoneMask = settings.masks.phone;
        }

        /**
         * @description
         * returns formatted phone number via filter
         */
        function getPhoneNumber() {
            if (!vm.updatedAgent.phoneNumber)
                return "";

            return $filter('phoneNumber')(vm.updatedAgent.phoneNumber);
        };

        /**
         * @description
         * sets scope to enable editing of agent's profile information
         */
        vm.editProfile = function () {
            vm.updatedAgent = angular.copy(vm.agent);
            $scope.agentAdddressForm.$setPristine();
            vm.editMode = true;
            $timeout(function () { $('input[name="street"]').focus(); }, 100);
        };

        /**
         * @description
         * sets up scope to cancel the editing of agent's profile information
         */
        vm.cancelEdit = function () {
            vm.editMode = false;
            intentService.resetIntent();
        };

        /**
         * @description
         * saves agent's edited profile information back to the server
         */
        vm.saveProfile = function () {
            intentService.setIntent("Saving Agent Information ...");
            agentService.saveAgent({
                agentId: vm.agent.agentId,
                firstName: vm.agent.firstName,
                lastName: vm.agent.lastName,
                birthdate: vm.agent.birthdate,
                emailAddress: vm.agent.emailAddress,
                phoneNumber: getPhoneNumber(),
                address: vm.updatedAgent.address,
                copyMe: vm.updatedAgent.copyMe
            }).then(function () {
                intentService.resetIntent();
                loadAgent();
            }, function (reason) {
                intentService.resetIntent();
                console.warn("Erorr in saving agent: %o", reason);
                utilService.showPopup("Error", "Failed while trying to save the agent information.");
                vm.cancelEdit();
            });
        };

        /**
         * @description
         * loads agent's fresh information from the server
         */
        function loadAgent() {
            agentService.getAgent(vm.currentAgent.agentId).$promise.then(function (agent) {
                vm.agent = agent;
                vm.cancelEdit();
            }, function (error) {
                console.warn("Erorr in retrieving agent : %o", error);
                utilService.showPopup("Error", "Failed while trying to retrieve the agent's information.");
            });
        };
        
        /**
         * @description
         * opens change password modal
         */
        vm.editPassword = function () {
            var changedata = {
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
                showMessage: false,
                message: "",
            }

            //Modal Windows
            var modalInstance = $modal.open({
                templateUrl: 'app/agent/changeModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', 'authService', 'utilService', function ($scope, $modalInstance, authService, utilService) {
                    //Set Modal Scope Values
                    $scope.change = changedata;
                    
                    $scope.sendPassword = function (isFormValid) {
                        if (isFormValid) {
                            authService.changePassword($scope.change.currentPassword,
                            $scope.change.newPassword,
                            $scope.change.confirmPassword,
                            function (response) {
                                var customIcon = "fa-exclamation-circle fa-icon-medium";
                                var responseMessage = "Your password has been changed!";

                                // If there is a message coming back from the response, display the message
                                if (response.message) {
                                    customIcon = null;
                                    responseMessage = response.message;
                                }

                                utilService.showPopup("Password Change", responseMessage, customIcon);
                                $modalInstance.dismiss('close');
                            },
                            function (error) {
                                $scope.change.showMessage = true;

                                // Error message is passed back from server but may not be user friendly message
                                $scope.change.message = "There was an error changing your password.";
                             }
                          );
                        }
                    }

                    //Function when canceled
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }]
            });
        }

        init();
    };
})();