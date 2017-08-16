(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name manageAgentsController
     *
     * # viewAgentsController
     *
     * @description
     * controller for agents view and  on manage agents page
     */
    angular.module('agentPortal')
        .controller('agentDetailController', ['$q', '$filter', '$stateParams', '$timeout', 'agentService', 'settings', '$modal', 'utilService','portalService', '$scope', 'storage', '$state', 'intentService', agentDetailController]);

    function agentDetailController($q, $filter, $stateParams, $timeout, agentService, settings, $modal, utilService, portalService, $scope, storage, $state, intentService) {
        var vm = this;

        vm.agentId = $stateParams.agentId;
        vm.title = 'Agent Details';
        vm.dateFormat = '';
        vm.editMode = false;
        vm.agent = {};
        vm.agent.address = {};
        vm.agent.phoneTypes = [{ value: 'phone', displayName: 'Phone' }, { value: 'mobile', displayName: 'Mobile' }]
        vm.agent.otherAddress = { country : 'US' };
        vm.agent.phones = [{phone:"",phoneType:""}];
        vm.currentAgent = {};

        /**
         * @description
         * initialization - loads fresh agent information from server
         */
        function init() {
            portalService.getAgentByInternalId().then(function (agent) {
                vm.currentAgent = agent;

                if (!vm.currentAgent.isSuperUser) {
                    $state.go('dashboard');
                }

                portalService.loadDRPAgentForAgency(vm.currentAgent.agencyId).then(function (result) {
                    if (result) {
                        //Setting DRP agent id
                        if (result.result) {
                            vm.drpAgentID = result.result;
                        }
                    }

                    initMasks();

                    if (vm.agentId) {
                        loadAgent();
                    }
                    else {
                        vm.editMode = true;
                    }

                    vm.lookup = agentService.getStates();
                });
            });
        };
        /**
       * @description
       * open expire agent cofirm dialogs..
       */
        vm.expireAgent = function () {
            vm.modalTitle = "Expire Agent";
            vm.yesButtonText = "Yes";
            vm.noButtonText = "No";
            vm.expireAgentMessage = "Expiring an agent removes their ability to log in and sell policies. You can always undo this later. Are you sure you want to remove " + vm.agent.name + "?";
            $('#popupExpireAgent').modal('toggle');
        }
        /**
        * @description
        * expire agent to call apiservice
        */
        vm.confirmExpireAgents = function () {
            if (vm.agentId) {
                agentService.expireAgent(vm.agentId).then(function (result) {
                    if (result)
                        init();
                });

            }

        };
        /**
     * @description
     * open activate agent cofirm dialogs..
     */
        vm.activateAgent = function () {
            vm.modalTitle = "Reactivate Agent";
            vm.yesButtonText = "Yes";
            vm.noButtonText = "No";
            vm.expireAgentMessage = "Are you sure you want to reactivate " + vm.agent.name + "? This will allow them to log in and sell policies.";
            $('#popupActivateAgent').modal('toggle');
        }
        /**
        * @description
        * activate agent to call apiservice
        */
        vm.confirmReactivateAgents = function () {
            if (vm.agentId) {
                agentService.activateAgent(vm.agentId).then(function (result) {
                    if (result)
                        init();
                });

            };
        };
        /**
         * @description
         * initalizes mask for phone number field
         */
        function initMasks() {
            vm.phoneMask = settings.masks.phone;
            vm.dateMask = settings.masks.date;
            vm.datePlaceholder = settings.date.displayFormat;
        }

        /**
         * @description
         * returns formatted phone number via filter
         */
        //function getPhoneNumber() {
        //    if (!vm.updatedAgent.phoneNumber)
        //        return "";

        //    return $filter('phoneNumber')(vm.updatedAgent.phoneNumber);
        //};

        /**
         * @description
         * returns page title
         */
        vm.pageTitle = function () {
            if (vm.agentId)
            {
                if (vm.editMode)
                {
                    return 'Edit Agent Details';
                }
                else
                {
                    return 'Agent Details';
                }
            }
            else
            {
                return 'Add Agent';
            }
        }

        /**
        * @description
        * add phone
        */
        vm.addPhone = function () {
            //vm.agent.phones.push({});
        };
        /**
       * @description
       * remove phone
       */
        vm.removePhone = function (index) {
            vm.agent.phones.splice(index, 1);
        };

        /**
      * @description
      * add other address...
      */
        vm.addOtherAddress = function () {
            vm.agent.otherAddress = {};
        };

        /**
      * @description
      * validate zip code....
      */
        vm.validateZipCode = function (postalCode, state) {
            if (!state && !postalCode)
                return;

            var regexp2 = /^\d{5}$/;
            if (!regexp2.test(postalCode)) {
                $scope.agentForm.otherAddressPostalCode.$setValidity('validZip', false);
                return;
            }

            if (state && postalCode) {
                $scope.agentForm.otherAddressPostalCode.$setValidity('validZip', true);
                portalService.VerifyPostalCodeWithState(postalCode, state, function (result) {
                    //If we got a result lets check it,  otherwise just pass back value and assume it is valid
                    //this is done in case the service is down we still want to register customers
                    if (result) {
                        if (result.result === false) {
                            $scope.agentForm.otherAddressPostalCode.$setValidity('validZip', false);
                        }
                    }
                });
            }
        };
       
        /**
         * @description
         * sets scope to enable editing of agent's Agent information
         */
        vm.editAgent = function () {
            vm.updatedAgent = angular.copy(vm.agent);
            vm.updatedAgent.birthDate = moment(vm.agent.birthDate).format('MM/DD/YYYY');
            //$scope.agentAdddressForm.$setPristine();
            vm.editMode = true;
            //$timeout(function () { $('input[name="street"]').focus(); }, 100);
        };

        /**
         * @description
         * sets up scope to cancel the editing of agent's Agent information
         */
        vm.goBack = function () {
            $state.go('adminManageAgents');
        };

        /**
         * @description
         * sets up scope to cancel the editing of agent's Agent information
         */
        vm.cancelEdit = function () {
            if (vm.agentId) {
                vm.editMode = false;
            }
            else
            {
                $state.go('adminManageAgents');
            }
            
            intentService.resetIntent();
        };
        /**
       * @description
       * opens the date picker control.
       */
        vm.openDatePicker = function ($event, openFlag) {
            $event.preventDefault();
            $event.stopPropagation();
            vm[openFlag] = true;
        }
        /**
         * @description
         * saves agent's edited Agent information back to the server
         */
        vm.saveAgent = function () {
            intentService.setIntent("Saving Agent Information ...");
            agentService.saveAgentDetail({
                agentId: vm.agent.agentId,
                firstName: vm.updatedAgent.firstName,
                lastName: vm.updatedAgent.lastName,
                birthdate: !vm.updatedAgent.birthDate ? vm.updatedAgent.birthDate : moment(vm.updatedAgent.birthDate).format('YYYY-MM-DD'),
                email: vm.updatedAgent.email,
                fax: vm.updatedAgent.fax,
                homePhone: vm.updatedAgent.homePhone,
                mobilePhone: vm.updatedAgent.mobilePhone,
                otherAddress: vm.updatedAgent.otherAddress,
                otherPhone: vm.updatedAgent.otherPhone,
                phone: vm.updatedAgent.phone,
                salutation: vm.updatedAgent.salutation,
                title: vm.updatedAgent.title,
                copyMe: vm.updatedAgent.copyMe,
                showCommission: vm.updatedAgent.showCommission
            }).then(function (result) {
                intentService.resetIntent();
                if (result.exceptionMessage)
                {
                    utilService.showPopup("Error", arguments[0].exceptionMessage);
                }
                else
                {
                    if (vm.agent.agentId) {
                        // Successfule Update 
                        loadAgent();
                    }
                    else {
                        // Successfule Create 
                        $state.go('adminManageAgentsView', { agentId: result.result });
                    }
                }
                
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
            agentService.getAgentDetail(vm.agentId).then(function(agent){
                vm.agent = agent;
                vm.cancelEdit();
            });
        };

        /**
         * @description
         * returns true or false for Edit button disable
         */
        vm.disableEdit = function ()
        {
            if (vm.agent.agentId == undefined) {
                return true;
            }
            if (vm.drpAgentID.toLowerCase() == vm.agent.agentId.toLowerCase()) {
                //For DRP Agent
                return true;
            }

            return false;
        }

        /**
         * @description
         * returns true or false for Expire/Reactivate button disable
         */
        vm.disableAction = function () {
            if (vm.agent.agentId == undefined) {
                return true;
            }
            if (vm.drpAgentID.toLowerCase() == vm.agent.agentId.toLowerCase()) {
                //For DRP Agent
                return true;
            }

            if (vm.agent.agentId.toLowerCase() == vm.currentAgent.agentId.toLowerCase()) {
                //For Current User
                return true;
            }

            return false;
        }
     
        init();
    }
})();