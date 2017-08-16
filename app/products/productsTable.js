(function () {

    angular
        .module('agentPortal')
        .directive('productsTable', productsTable);

    productsTable.$inject = ['productTableService', '$parse'];

    function productsTable(productTableService, $parse) {

        var directive = {
            restrict: 'E',
            scope: {
                customerId: '=',
                residenceState: '=',
                suppressWarning: '=',
                onSendQuickQuote: '=',
                cta: '='
            },
            templateUrl: 'app/products/productsTable.html',
            replace: true,
            bindToController: true,
            controllerAs: 'vm',
            controller: PackageBreakdownController,
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            
            scope.$watch(function () { return attrs.packages; }, function (packages) {
                if (packages) {
                    var parsedPackages = $parse(packages)(scope);
                    setupPackageDisplay(parsedPackages);
                }
            }, true);

            scope.$watch(function () { return attrs.quotes; }, function (quotes) {
                if (quotes) {
                    var parsedQuotes = $parse(quotes)(scope);
                    setupQuotesDisplay(parsedQuotes);
                }
            }, true);

            function setupPackageDisplay(packages) {
                var allCoverages = [];
                vm.packageRatingIds = [];
                vm.coverageGroups = {};
                vm.packageMaps = {};

                for (var i = 0; i < packages.length; i++) {
                    var pkg = packages[i];
                    var pkgData = productTableService.refinePackageData(pkg, allCoverages);

                    // Add current package to package map
                    vm.packageMaps[pkg.ratingId] = pkgData;
                    vm.packageRatingIds.push(pkg.ratingId);
                }

                vm.coverageGroups = productTableService.groupCoverages(allCoverages);
            }

            function setupQuotesDisplay(quotes) {
                vm.quoteMaps = {};
                if (quotes.length > 0) {
                    vm.showPremium = true;
                    vm.showPurchaseButton = true;
                }

                for (var i = 0; i < quotes.length; i++) {
                    vm.quoteMaps[quotes[i].package.ratingId] = quotes[i];
                    vm.packageMaps[quotes[i].package.ratingId].totalPrice = quotes[i].baseQuoteAmount + quotes[i].totalFees, 10;
                    vm.packageMaps[quotes[i].package.ratingId].tripCost = 0;
                }
            }

            vm.sendQuickQuote = function sendQuickQuote() {
                if (vm.onSendQuickQuote != null) {
                    var packagesToQuote = getQuickQuotePackages();
                    vm.onSendQuickQuote(packagesToQuote);
                }
            }

            function getQuickQuotePackages() {
                var packagesToQuote = [];

                for (var i = 0; i < vm.packageRatingIds.length; i++) {
                    var packageName = vm.packageRatingIds[i];
                    var quickQuotePackage = {
                        premium: vm.packageMaps[packageName].totalPrice,
                        displayName: vm.packageMaps[packageName].package.name,
                        displayNameSubtitle: vm.packageMaps[packageName].package.subTitle,
                        ratingId: vm.packageMaps[packageName].package.ratingId
                    };

                    packagesToQuote.push(quickQuotePackage);
                }

                return packagesToQuote;
            }
        }
    }

    PackageBreakdownController.$inject = ['quotes', 'agents', 'utilService', '$window', '$localStorage', 'portalService', 'format', 'purchaseNavigationService', 'productsTableDataMapper', '$scope'];

    function PackageBreakdownController(quotes, agents, utilService, $window, $localStorage, portalService, format, purchaseNavigationService, productsTableDataMapper, $scope) {
        var vm = this;
        var conditional = "Conditional";
        var required = "Required";
        var defaultFlightSegments = null;

        function init() {
            portalService.loadConfig()
                .then(function (config) {
                    defaultFlightSegments = config.CLIENT_DEFAULT_FLIGHT_SEGMENTS;
                }, function () {
                    utilService.showPopup("Error", "Failed while trying to load client settings. Please try again.");
                });
        }

        vm.buyPackage = function (ratingId) {
            if (vm.quoteMaps) {
                var quote = vm.quoteMaps[ratingId];
                if (quote) {
                    if (quote.hasLicense !== true && vm.residenceState && !vm.suppressWarning) {
                        vm.showWarning(ratingId);
                        return;
                    }
                }
            }

            vm.actualBuyPackage(ratingId);
        };

        vm.getPackageDetails = function showPackageDetails(packageName) {
            if (vm.quoteMaps && vm.quoteMaps[packageName]) {
                return vm.quoteMaps[packageName];
            }
        }

        vm.actualBuyPackage = function (ratingId) {
            var sessionId = new Date().getTime();
            if (vm.cta) {
                vm.cta.sessionId = sessionId;
            }

            if (vm.residenceState != null) {
                vm.generateSession(ratingId);
            }

            if (vm.packageMaps[ratingId]) {
                purchaseNavigationService.navigateToPurchase(vm.packageMaps[ratingId].package, vm.customerId, null, sessionId);
            }
        }

        vm.showWarning = function (ratingId) {
            var state = vm.residenceState

            var errorString = "Our records indicate that your agency does not have the license(s) required by the "
            errorString += " state of " + state + " to receive commission for insurance sales to " + state + " residents. You"
            errorString += " can continue and save, send, or purchase this quote, but your agency will not receive"
            errorString += " commission on the sale. If you feel you’ve received this message in error or would like to"
            errorString += " activate this state license, please contact your sales representative.";
            var buttons = [];
            buttons.push({
                style: "btn btn-lg btn-default btn-cust",
                name: "Continue",
                action: function () {
                    vm.actualBuyPackage(ratingId);
                }
            });

            utilService.showConfirmPrimaryTraveler("Unlicensed Warning", errorString, buttons);
        }

        vm.generateSession = function (ratingId) {
            var quote = vm.quoteMaps[ratingId];
            if (quote) {
                $window.sessionStorage.setItem('currentQuote', JSON.stringify(quote));
            }

            if (vm.cta) {
                var quickQuoteData = productsTableDataMapper.mapFromQuote(vm.cta, vm.packageMaps, ratingId);
                $localStorage.quote = quickQuoteData;
                $window.sessionStorage.setItem('purchaseData', JSON.stringify(vm.cta));
            }
        }

        vm.pointLabel = 'Points';
        vm.pointShortLabel = 'Points';
        agents.getCurrentAgent().then(function (agent) {
            if (agent.rewardPointName && agent.rewardPointName !== null) {
                vm.pointLabel = agent.rewardPointName;
            }

            if (agent.rewardPointShortName && agent.rewardPointShortName !== null) {
                vm.pointShortLabel = agent.rewardPointShortName;
            }
        }, function () { });

        vm.shouldShowMaxFlights = function (pkg) {
            var showMaxFlights = false;

            if (defaultFlightSegments !== null && pkg) {
                if (vm.quoteMaps) {
                    var packageConfig = pkg.package.configuration;
                    var quote = vm.quoteMaps[pkg.package.ratingId];

                    if (quote && quote.flights && quote.flights.length >= defaultFlightSegments && packageConfig) {
                        showMaxFlights = packageConfig.maximumNumberFlightsTotal && (packageConfig.flightRequirementType === conditional || packageConfig.flightRequirementType === required);
                    }
                }
            }

            return showMaxFlights;
        };

        init();
    }

})();
