(function() {
    'use strict';

    /**
     * @ngdoc controller
     * @name sideBarController
     *
     * # sideBarController
     *
     * @description
     * controller for supporting side-bar menu navigation, or, top menu in case of smaller devices
     */
    angular.module('agentPortal')
        .controller('sideBarController', ['$state', 'responsiveService', 'statePersister', '$q', 'utilService', 'authService', 'storage', 'agents', 'portalService', '$window', sideBarController]);


    function sideBarController($state, responsiveService, statePersister, $q, utilService, authService, storage, agents, portalService, $window) {
        var vm = this;
        vm.route = { url: "/dashboard", title: "Dashboard", state: 'dashboard' };

        vm.selectedState = statePersister.retrieve() || "";
        vm.agent = {};
        vm.lookups = {
            states: []
        };

        var sideBarRoutes = [
            { url: "/dashboard", state: 'dashboard', title: "Dashboard", glyph: "fa fa-tachometer" },
            { url: "/quickquote", state: 'quickquote', title: "Products", glyph: "fa fa-shield" },
            { url: "/quotes", state: 'quotes', title: "Quotes", glyph: "fa fa-folder" },
            { url: "/customers", state: 'customers', title: "Customers", glyph: "fa fa-user" },
            { url: "/policies", state: 'policiesFilter', title: "Policies", glyph: "fa fa-file-text" },
            { url: "/training", state: 'training', title: "Training", glyph: "fa fa-tasks" },
            { url: "/banners", state: 'banners', title: "Banner Ads", glyph: "fa fa-picture-o" }
        ];

        /**
         * @description
         * get display styling related information for given route
         */
        vm.getClass = function (route) {
            var current = $state.$current;
            if (!route.title || !current || !$state.$current) {
                return '';
            }

            var currState = current.name;
            if (currState == 'dashboard' && vm.route.state != currState) {
                currState = vm.route.state;
            }
            if (contains(currState, route.state)) {
                return 'active';
            }
            if (route.subRoutes)
            {
                for (var i = 0; i < route.subRoutes.length; i++)
                {
                    if (contains(currState, route.subRoutes[i].state)) {
                        return 'active';
                    }
                }
            }

            return '';
        };

        /**
         * @description
         * get display styling related information for given route
         */
        vm.getSubClass = function (route) {
            var current = $state.$current;
            if (!route.title || !current || !$state.$current) {
                return '';
            }

            var currState = current.name;
            if (contains(currState, route.state)) {
                return 'subactive';
            }

            return '';
        };

        vm.executeResponsibility = function (route) {
            vm.route = route;

            var event = jQuery.Event("bhtp.willNavigate");
            $($window).trigger(event, [continueNavigation]);
            if (!event.isDefaultPrevented()) {
                continueNavigation();
            }

            function continueNavigation() {
                if (route.priorAction) {
                    var canNavigate = route.priorAction();

                    if (canNavigate !== false) {
                        vm.navigateTo(route);
                    }
                }
                else {
                    vm.navigateTo(route);
                }
            }
        }

        /**
         * @description
         * navigates the clicked item on side-bar menu
         */
        vm.navigate = function () {
            vm.navigateTo(vm.route);
        };

        vm.navigateTo = function (route)
        {
            if (route.subRoutes) {
                $state.go(route.subRoutes[0].state);
            }
            else {
                $state.go(route.state);
            }
        }

        function contains(stringToSearch, searchValue) {
            var result = null;
            if (stringToSearch == null) {
                result = false;
            }

            if (stringToSearch.toLowerCase() == searchValue.toLowerCase()) {
                return true;
            }
            result = stringToSearch.toLowerCase().indexOf(searchValue.toLowerCase()) > -1;
            return result;
        }

        /**
         * @description
         * on smaller screen, the drop-down popup menu needs to be explicitly collapsed 
         */
        vm.collapse = function (event) {
            if (responsiveService.runningOnSmallDevice() || responsiveService.runningOnExtraSmallDevice()) {
                $(".navbar-collapse").collapse('hide');
            }
        };


        /*
         * State Flyout Resources
         */
        vm.afterStateSelectionNavTo = function (route) {
            deactivateStateFlyout();

            if (vm.selectedState !== undefined && vm.selectedState !== null && utilService.trim(vm.selectedState).length > 0) {
                vm.navigateTo(route);
            }

            vm.selectedState = "";
        }
        /*
        * Check whether to show subitems or not
        */
        vm.checkDisplaySubItem = function (route)
        {
            if (route.subRoutes) {
                if (vm.route.url == route.url)
                {
                    return true;
                }
                for (var i = 0; i < route.subRoutes.length; i++)
                {
                    if (vm.route.url == route.subRoutes[i].url)
                    {
                        return true;
                    }
                }
            }
            
            return false;
        }

        function askStateFlyout() {
            var state = statePersister.retrieve();

            if (state === undefined || state === null) {
                activateStateFlyout();
                return false;
            }
        }

        function activateStateFlyout() {
            var selector = $('#flyout-state-selector');
            selector.addClass('in-view').removeClass('out-of-view');
            openSelect('#flyout-state-selector');
        }

        function deactivateStateFlyout() {
            var selector = $('#flyout-state-selector');
            selector.addClass('out-of-view').removeClass('in-view');
        }

        function activate() {
            var promises = [];

            promises.push(portalService.loadStates().then(function (response) {
                vm.lookups.states = response.states;
            }));

            
                promises.push(portalService.getAgentByInternalId().then(function (agent) {
                    vm.agent = agent;

                    if (global_enable_settings)
                    {
                        if (agent.isSuperUser) {
                            sideBarRoutes.push({
                                url: "/admin/manageAgents",
                                state: 'adminManageAgents',
                                title: "Manage Agents",
                                glyph: "fa fa-cog",
                            });

                            if (portalService.getCurrentAgentCanInvoice()) {
                                sideBarRoutes.push({
                                    url: "/admin/policyManagement",
                                    state: 'adminPolicyManagement',
                                    title: "Upload Policies",
                                    glyph: "fa fa-upload",
                                });
                            }

                            if (portalService.getCurrentAgentCanUsePoints()) {
                                sideBarRoutes.push({
                                    url: "/admin/verifyPoints",
                                    state: 'adminVerifyPoints',
                                    title: "Verify Points",
                                    glyph: "fa fa-check-square-o",
                                });
                            }

                            if (portalService.getCurrentAgentCanUseBulkPolicies()) {
                                sideBarRoutes.push({
                                    url: "/admin/batchUpload",
                                    state: 'adminBatchUpload',
                                    title: "Batch Policies",
                                    glyph: "fa fa-table",
                                });
                            }
                        }
                    }
                }));
            
            $q.all(promises).then(function () {
                vm.navRoutes = sideBarRoutes;
            });

            $(document).on('click', function (event) {
                if (!$(event.target).closest('#flyout-state-selector, #side-nav-Products').length) {
                    deactivateStateFlyout();
                }
            });
        }

        function openSelect(selector) {
            var element = $(selector)[0], worked = false;

            if (element) {
                $('#flyout-state-selector').trigger('open');
            }
            if (!worked) {
                if (document.createEvent) { // all browsers
                    var e = document.createEvent("MouseEvents");
                    e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    worked = element.dispatchEvent(e);
                } else if (element.fireEvent) { // ie
                    worked = element.fireEvent("onmousedown");
                }
            }
            
            if (!worked) { // unknown browser / error
                alert("It didn't work in your browser.");
            }
        }

        activate();
    }
})();