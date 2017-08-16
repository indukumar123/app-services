(function () {
    'use strict';

    angular.module('agentPortal')
        .controller( 'policyReceiptController',
            ['$q', '$window', 'portalService', 'storage', 'settings', 'utilService', 'policiesService',
                'productService', 'exactCareDataMapper', '$state', 'googletagmanager', 'tramsService', 'format', 'debugService', policyReceiptController] );

    /**
    * @ngdoc controller
    * @name policyReceiptController
    *
    * # policyReceiptController
    *
    * @description
    * controller to support Policy Receipt functionality
    */
    function policyReceiptController( $q, $window, portalService, storage, settings, utilService, policiesService,
                                        productService, exactCareDataMapper, $state, googletagmanager, tramsService, format, debugService) {
        var vm = this;

        /**
         * @description
         * initialization of fields on the scope
         */
        vm.dateFormat = '';
        vm.packages = null;
        vm.agent = {};

        vm.isCustomSession = function () {
            return (window.sessionStorage.getItem("isCustomSession") == 'true');
        }

        vm.loadTramsReceipt = function () {
            console.log('Reloading page');

            window.sessionStorage.setItem('isCustomSession', false);
            console.log('iscustomSession: ' + window.sessionStorage.getItem('isCustomSession'));

            // Stop debug logging - DEBUGGING ONLY
            console.log('Ending logging');
            //debugService.stopDebug();

            // Post Back
            window.location.href = '/tramsreceipt';
        }

        vm.departureDate = function () {
            if ( !hasPolicy() ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.state.policyResponse.policy.departureDates.localized.dateString ) +
                        ' ' + vm.state.policyResponse.policy.departureDates.timeZoneAbbreviation;
        };

        vm.returnDate = function () {
            if ( !hasPolicy() ) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString( vm.state.policyResponse.policy.returnDates.localized.dateString ) +
                        ' ' + vm.state.policyResponse.policy.returnDates.timeZoneAbbreviation;
        };

        function hasPolicy() {
            return ( vm.state && vm.state.policyResponse && vm.state.policyResponse.policy &&
                    vm.state.policyResponse.policy.departureDates && vm.state.policyResponse.policy.returnDates );
        }


        /**
         * @description
         * initializes the receipt page. Fetches the policy by id and maps it to format understood by UI
         */
        function init() {
            restoreState();

            var promises = [];

            promises.push(portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
            }));

            promises.push(portalService.loadProductsAndPackages(null, vm.state.packageId).then(function (response) {
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                vm.packages.forEach(function (pakage) {
                    pakage.coverageDescriptions = [];
                    pakage.optionalCoverageDescriptions = [];
                    pakage.hasDetails = false;
                    productService.getCoverages(pakage.name).$promise.then(function (coverageDescriptions) {
                        coverageDescriptions.forEach(function (coverageDescription) {
                            coverageDescription.feature = coverageDescription.title;
                            coverageDescription.benefit = coverageDescription.content.split("|")[0];
                            coverageDescription.detail = coverageDescription.content.split("|")[1];
                            if (coverageDescription.detail != null && coverageDescription.detail.length > 0) {
                                pakage.hasDetails = true;
                            }
                            if (coverageDescription.type.indexOf('OptionalCoverage') == -1) {
                                pakage.coverageDescriptions.push(coverageDescription);
                            } else {
                                pakage.optionalCoverageDescriptions.push(coverageDescription);
                            }
                        });
                    }, function (error) {
                        console.warn("Failed while retrieving product coverages %o", error);
                        utilService.showPopup("Error", "Failed to retrieve information about products.");
                    });

                });
                vm.dateFormat = settings.date.format;

                vm.totalCost = vm.state.policyResponse.policy.premium + vm.state.policyResponse.policy.taxes +
                                    (vm.state.policyResponse.policy.fees ? vm.state.policyResponse.policy.fees : 0);
                if (!vm.state.billing.last4) {
                    logResponseError('No card details found');
                    return;
                }

                // if this is trams
                var isCustomSession = (window.sessionStorage.getItem('isCustomSession') == 'true');

                if (isCustomSession) {
                    // Start debug logging - DEBUGGING ONLY
                    //debugService.startDebug();
                    console.log('Starting logging');
                    console.log('iscustomSession: ' + isCustomSession);

                    if (vm.state.policyResponse.policy) {
                        console.log('Setting XML policy in cookie');
                        var xmlString = tramsService.getTramsXml(vm.state.policyResponse.policy, vm.state.policyResponse.travelers, 'exactcare');
                        document.cookie = "xml=" + encodeURI(xmlString);
                        console.log('Cookie XML: ' + xmlString);
                    }
                }
                else {
                    localStorage.removeItem('exactcare.state');
                }

                googleTagManagerPolicyPurchased();
            });
        }

        /**
         * @description
         * gets the receipt from ExactCare purchase state
         */
        function restoreState() {
            vm.state = storage.get('exactcare.state');

            vm.state.coverages.policyCoveragesTrip =
                exactCareDataMapper.mapFromCoverageTrip(vm.state.coverages, vm.state.policyResponse.policy.purchaseDate, vm.state.policyResponse.policy.tripCost);

            vm.state.coverages.policyCoveragesMedical =
                exactCareDataMapper.mapFromCoverageMedical(vm.state.coverages, vm.state.policyResponse.policy.purchaseDate, vm.state.policyResponse.policy.tripCost);

            var primaryTraveler = vm.state.policyResponse.travelers.filter(function (traveler) {
                return traveler.isPrimary;
            })[0];

            vm.coverages = [];
            if (vm.state.coverages) {
                if (vm.state.coverages.included) {
                    vm.coverages = vm.coverages.concat(vm.state.coverages.included);
                }

                if (vm.state.coverages.optional) {
                    for (var i = 0; i < vm.state.coverages.optional.length; i++) {
                        var optionalCoverage = vm.state.coverages.optional[i];
                        if (optionalCoverage.selected === true) {
                            vm.coverages.push(optionalCoverage);
                        }
                    }
                }
            }

            vm.state.customForm = [];
        }

        /**
         * @description
         * show error response if the policy cannot be fetched
         */
        function logResponseError(error) {
            utilService.showPopup('Error', 'There was an error fetching the receipt: ' + error);
        }

        /**
         * @description
         * Navigate to policy view page after purchase.
         */
        vm.navigateToPolicyViewFromReceipt = function () {
            $state.go('policiesView', { policyNumber: vm.state.policyResponse.policy.policyNumber });
        };

        /**
         * @description
         * Sends ecommerce data to google tag manager.
         */
        function googleTagManagerPolicyPurchased() {
            var policyInfo = vm.state.policyResponse.policy;
            var packageRevenue = policyInfo.premium + policyInfo.taxes + (policyInfo.fees ? policyInfo.fees : 0);
            var fullPackage = $.grep(vm.packages, function (pack) {
                return pack.id == policyInfo.packageId;
            })[0];

            var tripOrigination = vm.state.policy.primary.address.city + ' ; ' + vm.state.policy.primary.address.stateOrProvince + ' ; ' + vm.state.policy.primary.address.country;

            googletagmanager.newPolicyPurchased(policyInfo.policyNumber, policyInfo.submissionChannel, packageRevenue, policyInfo.taxes,
                                    policyInfo.packageName, fullPackage.productName, fullPackage.subTitle, 1, policyInfo.tripCost,
                                    tripOrigination, vm.state.policy.destination.country.name, policyInfo.departureDate, vm.agent.accountName);
        }

        init();
    }
})();