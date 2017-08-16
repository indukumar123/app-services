/*global angular */
/*jshint globalstrict: true*/
'use strict';
( function () {

    function AgentAutoCompleteDirectiveController($scope, agentService, $timeout, portalService) {
        var vm = this;
        
        // map scope values to vm.
        // default the search mode to agent code.
        vm.searchMode = $scope.searchMode ? $scope.searchMode : 'code';
        vm.searchValue = $scope.searchValue;
        vm.placeholder = $scope.placeholder;
        vm.disabledCssClass = $scope.disabledCssClass ? $scope.disabledCssClass : '';
        vm.currentAgentId = "";

        portalService.getAgentByInternalId().then(function (agent) {
            vm.currentAgentId = agent.agentCode;
        });

        vm.agentApiSuccess = function (results) {
            var agents = results.response;
            var shortAgents = [];
            for (var i = 0; i < agents.length; i++)
            {
                // if searching by name, return the name and agency name.
                //  if searching by agent code, just return the agent code.
                agents[i].agentAndAgencyInfo = calculateAgentNameDisplay(agents[i]);

                // note: displayValue property is used later in the typeahead template.
                agents[i].displayValue = vm.searchMode === 'name' ? agents[i].agentAndAgencyInfo : agents[i].agentCode;

                // short object as rest of properties are not required
                shortAgents.push({
                    agentAndAgencyInfo: agents[i].agentAndAgencyInfo,
                    code: agents[i].agentCode,
                    name : agents[i].agentName,
                    displayValue: agents[i].displayValue,
                    label: agents[i].displayValue
                });
            }
            return shortAgents;
        };

        vm.getAgents = function ( searchValue ) {
            var promise;

            if ( vm.searchMode && vm.searchMode === 'name' ) {
                promise = agentService.findAgentsByName(vm.currentAgentId, searchValue, vm.agentApiSuccess ).$promise;
            }
            else {
                promise = agentService.findAgentsByCode(vm.currentAgentId, searchValue, vm.agentApiSuccess ).$promise;
            }
            return promise;
        };
                
        vm.agentSelected = function ( item, agent, label ) {
            if ( vm.onSelected ) {
               vm.onSelected( { agent: agent } );       
            }
        };

        vm.valueChanged = function () {
            if ( vm.onChange ) {
                vm.onChange( { newValue: vm.searchValue[vm.searchMode] } );
            }
        }

        vm.fetchAgents = function () {
            vm.getAgents(vm.searchValue);
        }
    }

    function calculateAgentNameDisplay( agent ) {
        return agent.agentName + ', ' + agent.agentCode;
    }
    
    function AgentAutocompleteDirective() {
        return {
            restrict: 'E',
            controller: ['$scope', 'agentService', '$timeout', 'portalService', AgentAutoCompleteDirectiveController],
            controllerAs: 'vm',
            bindToController: true,
            templateUrl: '/app/layout/agentAutocomplete.html',
            priority: 999,
            scope: {
                searchMode: '@?agentSearchMode',
                onSelected: '&?agentOnSelected',
                searchValue: '=?',
                placeholder: '@?',
                disabledCssClass: '@?',
                onChange: '&?onInputChanged'
            },
            link: function ($scope, $elem, $attrs) {
               
            }
        };
    }

    angular.module( 'agentPortal' )
        .directive( 'agentAutocomplete', [AgentAutocompleteDirective] );
}() );