(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name authController
     *
     * # authController
     *
     * @description
     * provides initial authentication/authorization related functions.
     */
    angular.module('agentPortal')
        .controller('authController', [
            '$state', 'authService', '$scope', 'storage', 'auth', '$location', authController
        ]);

    /**
     * @description
     * constructor
     */
    function authController($state, authService, $scope, storage, auth, $location) {
        var vm = this;

        //temporary setting to help us not waste time on typing creds ...
        vm.username = "";
        vm.password = "";
        vm.forgotError = null;
        vm.hideForm = false;
        vm.cdnUrl = global_cdn_url;
        vm.usernameRequiredError = false;
        vm.usernameEmailError = false;
        vm.passwordRequiredError = false;

        /**
         * @description
         * initializes session...
         */
        function init() {
            // This if check is also in app.js (no the operation though)
            if (window.sessionStorage.customSession) {
                var customSession = JSON.parse(window.sessionStorage.customSession);
                vm.hideForm = true;
                vm.username = customSession.loginId;
                vm.password = customSession.password;
                vm.usernameRequiredError = false;
                vm.usernameEmailError = false;
                vm.passwordRequiredError = false;
                vm.login();
                window.sessionStorage.setItem('customSession', JSON.stringify(customSession));
                window.sessionStorage.setItem('isCustomSession', true);
            }
        }

        /**
         * @description
         * login function called when user clicks on login...
         */
        vm.login = function () {
            // This will show the widget to choose how to authenticate
            vm.loginError = null;
            authService.signin(vm.username,
                vm.password,
                function (data) {
                    // Figure out if the logged in user is an ambassador,  this is so we can redirect to the dash board
                    // if the are logging in not from a deep link,  or redirect to the deep link if there was
                    // one provided
                    if (data && data.agent) {
                        var isAmbassador = data.agent.isAmbassador;
                    }

                    //  Is custom session means that this login request came from trams and we need to redirect to the products page
                    var isCustomSession = (window.sessionStorage.getItem("isCustomSession") == 'true');

                    if (isCustomSession) {
                        $state.go('tramsproducts');
                        return;
                    }
                    
                    var returnUrl = (auth.state) ? auth.state : auth.config.auth0js._callbackURL;

                    // If there is a return url and it is not the default return url or the return url is not the login page send the agent to the requested page
                    if (returnUrl && returnUrl !== '/' && returnUrl.indexOf("/login") == -1) {
                        $location.url(returnUrl);
                    }
                    else {
                        // This is an ambassador who did not provide a deep link url, they will go to the quick quote page
                        if (isAmbassador) {
                            $state.go("quickquote");
                        }
                        // Normal agent needs to go to the dashboard after login
                        else {
                            $state.go("dashboard");
                        }
                    }
                },
                function (error) {
                    if (window.sessionStorage.customSession) {
                        vm.hideForm = false;
                        vm.username = "";
                        vm.password = "";
                    }
                    else {
                        vm.loginError = error;
                    }
                }
            );
        };

        /**
        * @description
        * email validation...
        */
        function isValidEmail(email) {
            var regexp2 = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            return regexp2.test(email);
        }

        /**
        * @description
        * login function called when user clicks on login...
        */
        vm.validateAndLogin = function () {
            vm.validateEmail();
            vm.validatePassword();

            if (vm.passwordRequiredError || vm.usernameEmailError || vm.usernameRequiredError) {
                return;
            }

            vm.login();
        }

        /**
        * @description
        * validateEmail function called on blur and from validateAndLogin...
        */
        vm.validateEmail = function () {
            vm.usernameRequiredError = false;
            vm.usernameEmailError = false;

            if (!vm.username || vm.username.trim().length == 0) {
                vm.usernameRequiredError = true;
                vm.usernameEmailError = false;
            }
            else {
                vm.usernameRequiredError = false;
                if (!isValidEmail(vm.username)) {
                    vm.usernameEmailError = true;
                }
                else {
                    vm.usernameEmailError = false;
                }
            }
        }

        /**
          * @description
          * validatePassword function called on blur and from validateAndLogin...
          */
        vm.validatePassword = function () {
            vm.passwordRequiredError = false;
            if (!vm.password || vm.password.trim().length == 0) {
                vm.passwordRequiredError = true;
            }
            else {
                vm.passwordRequiredError = false;
            }
        }

        /**
         * @description
         * forgot password action implementation
         */
        vm.forgot = function () {
            // This will show the widget to choose how to authenticate
            vm.forgotError = null;
            authService.reset(vm.username,
                function () {
                    $state.go('login');
                },
                function (error) {
                    vm.forgotError = error;
                }
            );
        };

        init();
    }

    /**
     * @ngdoc directive
     * @name pwCheck
     *
     * # pwCheck
     *
     * @description
     * validates that both passwords provided on forgot password screen match
     */
    angular.module('agentPortal').directive('pwCheck', [pwCheck]);

    function pwCheck() {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var me = attrs.ngModel;
                var matchTo = attrs.pwCheck;
                if (!scope.watchAdded) {
                    scope.$watch('[me]', function (value) {
                        if (scope[me] != null && scope[matchTo] != null && scope[me].length > 0 && scope[matchTo].length > 0) {
                            ctrl.$setValidity('pwmatch', scope[me] === scope[matchTo]);
                        } else {
                            ctrl.$setValidity('pwmatch', true);
                        }
                    });
                    scope.watchAdded = true;
                }
            }
        };
    }

})();