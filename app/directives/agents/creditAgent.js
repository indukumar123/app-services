/*global angular */
/*jshint globalstrict: true*/
'use strict';

( function () {

    function CreditAgentDirectiveController($scope, agentService, $timeout) {
        var vm = this;
        $scope.vm = vm;

        // collapsed: the user closed the 'credit agent' panel.
        vm.collapsed = false;

        vm.code = $scope.vm.code ? $scope.vm.code.trim() : '';
        vm.isAmbassador = $scope.vm.isAmbassador ? $scope.vm.isAmbassador : false;
        vm.onAgentUpdated = $scope.vm.onAgentUpdated;
        vm.searchValues = {};
        vm.searchValues.agentCode = vm.code;
        vm.searchValues.agentName = '';
        vm.searchValues.disableInput = false;
        vm.searchCodeValues = angular.copy(vm.searchValues);
        vm.agentAndAgencyInfo = '';
        vm.agentAsked = false;
        vm.wasAgentCredited = vm.code && (vm.code.trim() !="") ? true : false;
        // cycleComplete will be true when the agent has been credited and the 'thanks' panel should close.
        // this will be false if no code was passed in; true if it was--meaning the panel will not be visible if an agent is already credited.
        if (!vm.agentAsked && vm.isAmbassador) {
            vm.wasAgentCredited = false;
        }
        vm.cycleComplete = vm.wasAgentCredited;
        vm.didAgentHelp = vm.wasAgentCredited;
        vm.wasAgentSelected = vm.wasAgentCredited;
        vm.showError = false;

        vm.agentHelped = function () {
            vm.didAgentHelp = true;
        };

        vm.collapseCreditAgentPanel = function () {
            vm.collapsed = true;
        };

        vm.closeAgentPanel = function () {
            vm.cycleComplete = true;
        };
        
        vm.cancelAgentCredit = function () {
            // reset the selected agent.
            vm.agentCode = '';
            vm.agentName = '';
            vm.agentAndAgencyInfo = '';
            vm.wasAgentSelected = false;

            vm.searchValues.code = '';
            vm.searchValues.name = '';
            vm.searchValues.disableInput = false;

            vm.notifyAgentUpdated( vm.agentCode );
        };

        vm.notifyAgentUpdated = function ( agentCode ) {
            // raise the parent event, if it exists.
            if (vm.onAgentUpdated) {
                vm.agentAsked = true;
                vm.onAgentUpdated( { agentCode: agentCode } );
            }
        }

        vm.openCreditAgentPanel = function () {
            // must open panel in step two (search for agent) if it was previously collapsed.
            vm.didAgentHelp = true;
            vm.collapsed = false;
        };

        vm.agentInfoChanged = function ( newValue ) {
            // hide the error after the user has manipulated the data.
            // the error only shows if the user clicked 'give agent credit' without data entered.
            vm.showError = false;
        }

        vm.agentSelected = function ( agent ) {
            vm.searchValues.disableInput = true;

            vm.agentCode = agent.agentCode;
            vm.searchValues.code = agent.agentCode;

            vm.agentAndAgencyInfo = agent.agentAndAgencyInfo;

            vm.agentName = agent.firstName + ' ' + agent.lastName;
            vm.searchValues.name = agent.agentAndAgencyInfo;

            vm.wasAgentSelected = true;

            vm.notifyAgentUpdated( vm.agentCode );
        };

        vm.giveAgentCredit = function () {
            // exit if there was no agent specified.
            if (!vm.searchValues.agentCode) {
                vm.showError = true;
                return;
            }

            // lock in the agent as being credited.
            vm.wasAgentCredited = true;
            vm.notifyAgentUpdated(vm.searchValues.agentCode);
            // close the 'thanks' panel after 5 seconds.
            $timeout( function () {
                vm.cycleComplete = true;
            }, 5000 );
        };
    }

    function CreditAgentDirective() {
        return {
            restrict: 'E',
            templateUrl: '/app/layout/creditAgent.html',
            controller: ['$scope', 'agentService', '$timeout', CreditAgentDirectiveController],
            controllerAs: 'vm',
            //required in 1.3+ with controllerAs
            bindToController: true,
            scope: {
                code: '@?agentCode',
                isAmbassador : '@?isAmbassador',
                onAgentUpdated: '&'
            }
        };
    }



    angular.module('agentPortal').directive('creditAgent', CreditAgentDirective);

}() );

