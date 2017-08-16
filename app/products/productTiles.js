(function(){
    "use strict";

    angular.module( 'agentPortal' )
            .directive( 'productTiles', ProductTilesDirective );

    function ProductTilesDirective() {
        return {
            restrict: 'E',
            scope: {
                customerId: '=',
                cta: "=",
                agentCodePassed: "=",
                agent: "="
            },
            templateUrl: 'app/products/productTiles.html',
            replace: false,
            bindToController: true,
            controllerAs: 'vm',
            controller: ProductTilesController,
            link: link
        };
    };

    ProductTilesController.$inject = ['$scope', 'storage', '$window', 'format', 'portalService', 'purchaseNavigationService'];
    function ProductTilesController($scope, storage, $window, format, portalService, purchaseNavigationService) {
        var vm = this;
        $scope.vm = vm;
        vm.packages = [];
        vm.state = null;
        vm.stateName = null;
        vm.pleaseSelectMessage = "Please select a residence state to see products available in that state."
        vm.productsAvailableInMessage = "";
        vm.agentCode = vm.agentCodePassed;

        var isLoadingPackages = false;

        function getAllPackagesResolveAgent(agentCodeForPackages) {
            isLoadingPackages = true;
            // If there was an agent code passed in use that for packages,  otherwise
            // use the agent code of the current logged in agent.
            if (!vm.agentCode) {
                vm.agentCode = vm.agent.agentCode
            }
            return vm.getAllPackagesByAgentCode(vm.agentCode);
        }

        vm.getAllPackagesByAgentCode = function(agentCode) {
            isLoadingPackages = true;
           
                return portalService.loadPackagesForAgentByState(agentCode).then(function (response) {
                    var packagesByState = response.states;
                    vm.packagesByState = packagesByState;
                    isLoadingPackages = false;
                    if (vm.state) {
                        vm.showPackagesForState();

                    }
                }, function (err) {
                    isLoadingPackages = false;
                });
        }

        vm.buyPackage = function(pkg)
        {
            var sessionId = new Date().getTime();
            if (vm.cta)
            {
                vm.cta.sessionId = sessionId;
                $window.sessionStorage.setItem('purchaseData', JSON.stringify(vm.cta));
            }

            purchaseNavigationService.navigateToPurchase(pkg, vm.customerId, null, sessionId);
        }

        vm.showPackagesForState = function () {
            vm.packages = [];
            
            if (vm.packagesByState) {
                var stateWithPackages = vm.packagesByState.find(function (state) {
                    return state.iso2Code == vm.state;
                });

                vm.stateName = stateWithPackages.state;

                vm.packages = stateWithPackages.packages.filter(function (currentPackage) {
                    return portalService.isPackageAvailable(currentPackage);
                });
                vm.productsAvailableInMessage = "Products available in " + vm.stateName + " for agent with code " + vm.agentCode + ".";
            }
            else {
                vm.pleaseSelectMessage = "There are no products available for agent with code " + vm.agentCode + " in " + vm.stateName + ".";
            }
        }

        getAllPackagesResolveAgent(vm.agentCode);
        
    }

    function link(scope, element, attrs) {
        scope.$watch(function () { return attrs.state; }, function (state) {
            scope.vm.state = state;
            if (scope.vm.state && scope.vm.packagesByState) {
                scope.vm.showPackagesForState();
            }
        }, true);

        scope.$watch(function () { return attrs.agentCode; }, function (agentCode) {
            //Refresh the packages for a given agent code
            if (scope.vm.state && scope.vm.getAllPackagesByAgentCode) {
                // If they sent in an empty or null agent code we will default to the logged in agent
                scope.vm.agentCode = agentCode ? agentCode : scope.vm.agent.agentCode;
                scope.vm.getAllPackagesByAgentCode(scope.vm.agentCode).then(function () {

                    // If this agent has packages
                    if (scope.vm.state && scope.vm.packagesByState) {
                        scope.vm.showPackagesForState();
                    }
                });
            }
        }, true);
    }

}());