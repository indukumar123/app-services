(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('authenticationNavigationService', authenticationNavigationService);

    authenticationNavigationService.$inject = ['$rootScope', '$state', 'portalService', 'auth', 'ambassadorInformationSessionStorage', '$q', 'jwtHelper', 'storage', '$anchorScroll', '$stateParams', 'statePersister'];

    function authenticationNavigationService($rootScope, $state, portalService, auth, ambassadorInformationSessionStorage, $q, jwtHelper, storage, $anchorScroll, $stateParams, statePersister) {
        var service = {
            checkToken: checkToken,
            onStateChangeHandleBack: onStateChangeHandleBack,
            onStateChangeSuccess: onStateChangeSuccess,
            onStateChangeNavigation: onStateChangeNavigation,
            redirectAmbassadorForAction: redirectAmbassadorForAction
        };

        return service;

        /*
            Checks local storage for a jwt token,  validates that the token if found
            is not expired,  authenticates and initializes agent/ambassador if existing.
        */
        function checkToken(event) {
            var deferred = $q.defer();
            var token = localStorage.getItem('idToken');
            if (token) {
                if (!jwtHelper.isTokenExpired(token)) {
                    if (!auth.isAuthenticated) {
                        // The user is not authenticated,  but has a non-expired token in lopcal storage.
                        authenticateAndInitializeAgent(deferred, token);
                    } else {
                        // The user has a token in local storage and is authenticated
                        initializeAgent(deferred)
                    }
                } else {
                    // Token is expired, force login
                    forceLogout(deferred, event);
                }
            } else {
                // There is no token in local storage, they will be directed to login page
                forceLogout(deferred, event);
            }

            return deferred.promise;
        }

        /*
            Clears all data in storage and redirects to the login page.
        */
        function forceLogout(deferred, event) {
            if (event) {
                event.preventDefault();
            }
            auth.signout();
            storage.clearAll();
            portalService.logout();
            deferred.resolve(false);
            $state.go('login');
        }

        /*
            Sets up the agent based on the jwt in storage and initalizes them with the portal service
        */
        function authenticateAndInitializeAgent(deferred, token) {
            auth.authenticate(JSON.parse(localStorage.getItem('profile')), token).then(function () {
                initializeAgent(deferred)
            });
        }

        /*
            Initializes an Agent with the portal service
        */
        function initializeAgent(deferred) {
            portalService.initializeAgent().then(function (data) {
                if (portalService.getCurrentAgentIsAmbassador()) {
                    ambassadorInformationSessionStorage.setSession(ambassadorInformationSessionStorage.convertLocationDataIntoAmbassadorInformation({ ambassadorsAgentCode: data.agentCode }));
                }
                deferred.resolve(data);
            });
        }

        /*
               This function handels the preventing going back in the browser if an explicit config param is present, or if it is the receipt page.
        */
        function onStateChangeHandleBack(event, toState, toParams, fromState, fromParams) {
            $rootScope.preventBack = false;
            if (toState) {
                $rootScope.preventBack = ((toState.data && toState.data.preventBack) || (toParams && toParams.page === 'receipt'));
            }

            if (fromState) {
                if (fromState.data && fromState.data.preventBack && $rootScope.previousLocation === toState) {
                    if (toState.url.indexOf("policies/view") > 0 && $rootScope.previousLocation.url.indexOf("reciept")) {
                        return;
                    }

                    event.preventDefault();
                    $state.go('dashboard');
                }
            }
        }

        /*
               This function will set any route parameters passed into the Ambassador session storage, set the previous location to the page
               they were coming from, and a call to $anchorScroll.
        */
        function onStateChangeSuccess(event, toState, toParams, fromState, fromParams) {
            // Save any route params into session storage.
            if (portalService.getCurrentAgentIsAmbassador()) {
                ambassadorInformationSessionStorage.convertLocationDataIntoAmbassadorInformation($stateParams);
            }
            // URL of the page that is being navigated away from
            $rootScope.previousLocation = fromState;
            /*
            When called, it scrolls to the element related to the specified hash or (if omitted) to the current value of $location.hash(), according to 
            the rules specified in the HTML5 spec.
            */
            $anchorScroll();
        }

        /*
            Routes an ambassador from Sales Force based on the action to an ambassador state.
        */
        function redirectAmbassadorForAction(stateParams) {
            var state;

            // Add more agent routes as work for them is done.
            switch(stateParams.action) {
                case 'purchase':
                    state = 'quickquote';
                    break;
                default:
                    state = 'quickquote';
            }

            $state.go(state, $stateParams);
        }

        /*
            Main entry point for state routing,  on each state change request this will verify the token and route according to roles of
            the authenticated agent.
        */
        function onStateChangeNavigation(event, toState, toParams, fromState, fromParams) {

            // if it is a login, logout, or request where the token/roles routing have already been validated just return and let
            // the page route as normal.
            if (fromParams.skipTokenCheck || toState.name === 'logout' || toState.name === 'login' || toState.name === 'tramsproducts' || toState.name === 'loginForgot') {
                return;
            }
            else {
                event.preventDefault();
            }

            checkToken(event).finally(finishNavigation);

            function finishNavigation() {

                fromParams.skipTokenCheck = true;

                if (toState.data) {

                    // Remove the State from memory if the route does not request that it is persisted
                    if (!toState.data.persistState || toState.data.persistState == false) {
                        statePersister.destroy();
                    }

                    // If this is an ambassador that clicked the dashboard button send them to the quick quote page
                    if (toState.name === 'dashboard' && portalService.getCurrentAgentIsAmbassador() === true) {
                        $state.go("quickquote");
                        return;
                    }

                    // Prevent the user from navigating to pages if they are an ambassador and ambassadors are not allowed to view the page
                    if (!toState.data.allowAmbassador || toState.data.allowAmbassador === false) {
                        if (portalService.getCurrentAgentIsLoggedIn() === true && portalService.getCurrentAgentIsAmbassador() === true) {
                            $state.go('errorAmbassador');
                            return;
                        }
                    }

                    // Do not allow agent to type in /admin/policyManagement if they are not qualified to be on page.
                    if (toState.data.canPayWithInvoice && !portalService.getCurrentAgentCanInvoice()) {
                        $state.go('dashboard');
                        return;
                    }

                    // Do not allow agent to type in /admin/verifyPoints if they are not qualified to be on page.
                    if (toState.data.canUsePoints && !portalService.getCurrentAgentCanUsePoints()) {
                        $state.go('dashboard');
                        return;
                    }
                }
                
                // If none of the conditions are met and we did not return, route to requested state
                $state.go(toState.name, toParams)
            }
        };
    }

})();
