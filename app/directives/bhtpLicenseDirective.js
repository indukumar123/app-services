(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('bhtpLicenseDirective', bhtpLicenseDirective)

    bhtpLicenseDirective.$inject = [];

    function bhtpLicenseDirective() {
        return {
            restrict: 'EA',
            scope: {
                showWarning: '=',
                state : '=',
                packageId : '=',
                canContinue : '=',
                packageName : '=',
                ratingId: '='
            },
            templateUrl: 'app/layout/bhtpLicense.html',
            controller: bhtpLicenseDirectiveCtrl,
            replace: true,
            controllerAs: 'vm',
            bindToController: true,
            link: function (scope, element, attrs) {
                var vm = scope.vm;

                scope.$watch('vm.currentAgent', function (newValue, oldValue) {
                    if (newValue) {
                        vm.checkLicense();
                    }
                });
            }
        };
    }

    bhtpLicenseDirectiveCtrl.$inject = ['licenseService', 'portalService', 'utilService'];
    function bhtpLicenseDirectiveCtrl(licenseService, portalService, utilService) {
        var vm = this;
        vm.hidewarning = function () {
            vm.showWarning = false;
        }
        
        vm.checkLicense = function () {

            // Agent and State are required to perform license check
            if (!vm.currentAgent || !vm.state) {
                return;
            }
            
            vm.canContinue = true;
            
            // First, check that BHTP can sell the package
            licenseService.canBhtpSell(vm.packageId, vm.state).then(function (bhtpCanSell) {
                // Display prompt if BHTP cannot sell
                if (!bhtpCanSell) {
                    vm.canContinue = false;
                    vm.showWarning = false;
                    vm.warning = "";
                    utilService.showMessagePopup("Product Not Available", "We're sorry, but the Berkshire Hathaway Travel Protection product you chose is not approved for sale to residents of your selected state. Please select a different product and/or state, or click here to return to the previous page.");
                }
                else 
                {
                    if (!vm.ratingId)
                    { 
                        return;
                    }
                    // Changed logic to HA
                    licenseService.getStateLicense(vm.currentAgent.agentCode, vm.ratingId, vm.state).then(function (response) {
                        if (!response.canSell)
                        {
                            vm.showWarning = true;
                            if (vm.currentAgent.isAmbassador) {
                                vm.showWarning = false;
                            }
                            var state = vm.states.filter(function (f) {
                                return f.code == vm.state;
                            })[0];
                            vm.warning = "Our records indicate that your agency does not have the license(s) required by the state of " + state.name + " to receive commission for insurance sales to " + state.name + " residents. You can continue and save, send, or purchase this quote, but your agency will not receive commission on the sale. If you feel you've received this message in error or would like to activate this state license, please contact your sales representative.";
                       }
                        else {
                            vm.showWarning = false;
                            vm.warning = "";
                        }
                    }, function () { });
                }
            }, function(){});
        }

        vm.init = function () {
            portalService.getAgentByInternalId(null, false).then(function (agent) {
                vm.currentAgent = agent;
            });

            portalService.loadStates().then(function (response) {
                vm.states = response.states;
            });
        }

        vm.init();
    }

})();