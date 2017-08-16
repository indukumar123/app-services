(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name manageAgentsController
     *
     * # manageAgentsController
     *
     * @description
     * controller for agents listing on manage agents page
     */
    angular.module('agentPortal')
        .controller('manageAgentsController', ['$q', '$filter', '$stateParams', '$timeout', 'agentService', 'settings', '$modal', 'utilService', 'portalService', 'storage', '$state', manageAgentsController]);

    function manageAgentsController($q, $filter, $stateParams, $timeout, agentService, settings, $modal, utilService, portalService, storage, $state) {
        var vm = this;
        vm.title = 'Manage Agents';
        vm.filteredStatus = '';
        vm.selected = [];
        vm.refreshDataFlag = false;
        vm.reloadDataFlag = false;
        vm.drpAgentID = "";
        vm.agent = {};
        vm.ready = false;

        vm.addAgent = function ()
        {
            $state.go('adminManageAgentsCreate');
        }

        vm.expireAgent = function (agent) {
            vm.selectedAgentId = agent.agentId;

            vm.modalTitle = "Expire Agent";
            vm.yesButtonText = "Yes";
            vm.noButtonText = "No";
            vm.expireAgentMessage = "Expiring an agent removes their ability to log in and sell policies. You can always undo this later. Are you sure you want to remove " + agent.name + "?";
            $('#popupExpireAgent').modal('toggle');
        }

        $('#popupSuperUserconfirm').on('hidden.bs.modal', function (e) {
            vm.selectedAgentId = undefined;
        });

        vm.expireAgents = function (agentIds) {
            if (!vm.selectedAgentId)
                return;
            agentService.expireAgent(vm.selectedAgentId).then(function (result) {
                if (result) {
                    vm.refreshData();
                }
            });
        };

        /**
        * @description
        * open activate agent cofirm dialogs..
        */
        vm.activateAgent = function (agent) {
            vm.selectedAgentId = agent.agentId;
            vm.modalTitle = "Reactivate Agent";
            vm.yesButtonText = "Yes";
            vm.noButtonText = "No";
            vm.expireAgentMessage = "Are you sure you want to reactivate " + agent.name + "? This will allow them to log in and sell policies.";
            $('#popupActivateAgent').modal('toggle');
        }
        /**
        * @description
        * activate agent to call apiservice
        */
        vm.confirmReactivateAgents = function () {
            if (!vm.selectedAgentId)
                return;

            if (vm.selectedAgentId) {
                agentService.activateAgent(vm.selectedAgentId).then(function (result) {
                    if (result) {
                        vm.refreshData();
                    }
                });

            };
        };


        /**
        * @description
        * grid implementation - refreshes data locally after removing quotes so the removed quotes get excluded from display
        */
        vm.refreshSelectionToExclude = function (entityIds) {
            var newSelection = [];
            for (var index = 0; index < vm.selected.length; index++) {
                var current = vm.selected[index];
                if (entityIds.indexOf(current) === -1)
                    newSelection.push(current);
            }
            vm.selected = newSelection;
        };

        vm.loadData = function ()
        {
            var dateSelected = {
                startDate: null,
                endDate: null
            }
            vm.gridConfig.dateSelected = dateSelected;
            var deferredPromise = $q.defer();
            agentService.loadPagedData(vm.gridConfig.currentPage, vm.gridConfig.orderby, vm.gridConfig.reverse ? 'desc' : 'asc', vm.filteredStatus, vm.searchText).then(function (results) {
                vm.gridConfig.totalRecords = results.totalRecords;
                results.agents.forEach(function (agent) {
                    setAgentsActions(agent);
                });
                deferredPromise.resolve(results.agents);

            }, function (error) {
                deferredPromise.reject(error);
            });
            return deferredPromise.promise;
        }

        vm.getCustomFilters = function () {
            return [
                { key: "status", value: vm.filteredStatus }
            ];
        }

        var timeout;
        vm.searchChanged = function () {
            if (vm.agent.isSuperUser) {
                if (vm.timer) {
                    $timeout.cancel(vm.timer);
                }
                vm.timer = $timeout(function () {
                    vm.filterChanged();
                }, global_echo_timeout);
            }
            else {
                vm.filterChanged();
            }
        }
        /**
         * @description
         * grid refresh implementation
         */
        vm.refreshData = function () {
            vm.refreshDataFlag = true;
        };

        /**
         * @description
         * grid implementation to detect change of filter, basically invokes refreshData
         */
        vm.filterChanged = function () {
            vm.refreshData();
        };

        /**
         * @description
         * grid implementation for reseting the filters
         */
        vm.clearFilter = function () {
            vm.searchText = "";
            vm.refreshData();
        };

        /**
        * @description
        * Set custom actions based on status
        */
        function setAgentsActions(agent)
        {
            agent.actions = [];
            if (agent.agentId.toLowerCase() == vm.drpAgentID.toLowerCase() || agent.agentId.toLowerCase() == vm.agent.agentId.toLowerCase())
            {
                return;
            }

            if (agent.status == 'Active') {
                agent.actions.push({ label: "Expire", click: vm.expireAgent, icon: "fa fa-ban", href: "#" });
            }
            else if (agent.status == 'Expired') {
                agent.actions.push({ label: "Reactivate", click: vm.activateAgent, icon: "fa fa-refresh", href: "#" });
            }
        }

        function init()
        {
            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
                if (!vm.agent.isSuperUser) {
                    $state.go('dashboard');
                }

                portalService.loadDRPAgentForAgency(vm.agent.agencyId).then(function (result) {
                    vm.drpAgentID = result.result
                    vm.gridConfig = {
                        noDataMessage: "No agents found",
                        allowMultiSelect: false,
                        hasActions: true,
                        columns: [
                            { header: "Name", binding: "name", href: 'admin/manageAgents/view/{{row.agentId}}', preferredWidth: '20%' },
                            { header: "Agent ID", binding: "agentCode", preferredWidth: '10%' },
                            { header: "Title", binding: "title", preferredWidth: '10%' },
                            { header: "Email", binding: "email", preferredWidth: '10%' },
                            { header: "Phone Number", binding: "phone", preferredWidth: '10%' },
                            { header: "Status", binding: "status", preferredWidth: '10%' }
                        ],
                        actionList: [
                            { label: "View", icon: "glyphicon-eye-open", href: 'admin/manageAgents/view/{{row.agentId}}' }
                        ],
                        defaultOrderBy: "name",
                        defaultOrder: false,
                        rowIdentifier: "agentId",
                        agencyId: vm.agent.agencyId
                    };

                    vm.ready = true;
                });
            });
        }

        init();
    }
})();