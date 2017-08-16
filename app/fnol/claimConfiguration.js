(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('claimConfiguration', claimConfiguration)
    function claimConfiguration() {
        var directive = {
            restrict: 'EA',
            templateUrl: 'app/fnol/claimConfiguration.html',
            controller: claimConfigurationCtrl,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                policyNumber: '='
            },
            link: link
        };
        return directive;

        function link(scope, element, attrs) {
            scope.$watch('vm.fnol.risk', function (riskId) {
                if (scope.vm && scope.vm.fnol) {
                    scope.vm.requiredFields = [];
                    if (scope.vm.fnol.coverage && riskId) {
                        scope.vm.requiredFields = scope.vm.fnol.coverage.risks
                            .filter(function (risk) {
                                return risk.riskId === riskId;
                            })
                            .map(function (risk) {
                                return risk.requiredFields;
                            })[0]
                            .map(function (field) {
                                return field.replace(/ /gi, '_').toLowerCase();
                            });
                    }
                }
            });
        }
    }

    claimConfigurationCtrl.$inject = ['fnolService', 'portalService', 'policiesService', '$state', '$modal', '$q'];
    function claimConfigurationCtrl(fnolService, portalService, policiesService, $state, $modal, $q) {
        var vm = this;
        vm.fnol = {};
        vm.minCoverageGroup = 5;
        vm.formLoading = true;
        vm.requiresFlightsConstant = "Flights";
        vm.timeshareConstant = 'Timeshare';

        // Error used to display general details about error.
        vm.errorDetails = {
            title: "",
            content: ""
        };

        vm.datePickers = {
            dateOfLoss: {
                open: false
            }
        };

        // Error used when the data was not retrieved to start an FNOL properly.
        vm.stopFnolError = false;

        // Error flag used when there was a general error.
        vm.generalError = false;

        vm.onCountryChanged = onCountryChanged;
        vm.openDatePicker = openDatePicker;
        vm.resetForm = resetForm;
        vm.submitFnol = submitFnol;
        vm.cancelFnol = cancelFnol;
        vm.loadLocations = loadLocations;
        vm.setDateOfLoss = setDateOfLoss;
        vm.travelerRequired = travelerRequired;
        vm.openFraudWarning = openFraudWarning;
        vm.canClaimFixedCoverage = canClaimFixedCoverage;
        vm.policyHasFlights = policyHasFlights;
        vm.coverageRequiresFlights = coverageRequiresFlights;
        vm.getPackageByRatingId = getPackageByRatingId;
        vm.setDatePickerDates = setDatePickerDates;
        vm.updateTimeshareExpirationDate = updateTimeshareExpirationDate;

        function onCountryChanged() {
            vm.fnol.stateProvinceOfLoss = null;
            vm.fnol.cityOfLoss = null;
        }

        function openDatePicker($event, source) {
            $event.preventDefault();
            $event.stopPropagation();

            // Keep the current state of the selected date picker so we can toggle it on click
            var isOpen = vm.datePickers[source].open;

            for (var key in vm.datePickers) {
                if (vm.datePickers.hasOwnProperty(key)) {
                    vm.datePickers[key].open = false;
                }
            }

            vm.datePickers[source].open = !isOpen;
        }

        function resetForm(form) {
            vm.fnol.risk = null;
            if (vm.coverageGroup) {
                vm.coverageGroup = null;
            }
            // Reset form and inputs
            form.$setUntouched();
            form.$setPristine();
        }

        function submitFnol(formValid, fraudRead) {
            if (formValid === true) {
                if (!fraudRead) {
                    openFraudWarning(true);
                    return;
                }

                formatFnolForSubmission();

                if (canClaimFixedCoverage()) {
                    fnolService.submitFnolForClaim(vm.customerId, vm.formattedClaim).then(function handleSuccessFnol(response) {
                        fnolService.setCurrentClaim(response);
                        $state.go('fnolSummary');
                    }, function handleErrorFnol(error) {
                        vm.errorDetails.title = "Error Submitting Claim";
                        vm.errorDetails.content = "There was an error submitting this claim. Please contact customer support for more assistance."
                        if (error.message) {
                            vm.errorDetails.content = error.message;
                        }
                        vm.generalError = true;
                    });
                }
            }
        }

        function cancelFnol() {
            $state.go('policiesView', { policyNumber: vm.policyNumber });
        }

        function loadLocations() {
            vm.locationOptions = [];
            if (vm.fnol.flight) {
                for (var i = 0; i < vm.claimConfig.flights.length; i++) {
                    if (vm.claimConfig.flights[i].id === vm.fnol.flight) {
                        vm.locationOptions.push({
                            airportCode: vm.claimConfig.flights[i].arrivalAirportCode,
                            dateTimeOfFlight: moment(vm.claimConfig.flights[i].arrivalDate, moment.ISO_8601).format("MM-DD-YYYY"),
                            id: vm.claimConfig.flights[i].arrivalAirport
                        });
                        vm.locationOptions.push({
                            airportCode: vm.claimConfig.flights[i].departureAirportCode,
                            dateTimeOfFlight: moment(vm.claimConfig.flights[i].departureDate, moment.ISO_8601).format("MM-DD-YYYY"),
                            id: vm.claimConfig.flights[i].departureAirport
                        });
                    }
                }
            }
        }

        function setDateOfLoss() {
            if (!vm.fnol.dateOfLoss || (!vm.requiredFields.includes('date_of_loss') && vm.fnol.dateOfLoss)) {
                for (var i = 0; i < vm.locationOptions.length; i++) {
                    if (vm.locationOptions[i].id === vm.fnol.locationOfLoss) {
                        if (moment(vm.locationOptions[i].dateTimeOfFlight).isAfter(moment().endOf('day'))) {
                            vm.fnol.dateOfLoss = moment().startOf('day').format("MM/DD/YYYY");
                        } else {
                            // this trims the date coming in or formats it to moment date, depending on Firefox or other browsers - hack for a bug in firefox
                            vm.fnol.dateOfLoss = moment(vm.locationOptions[i].dateTimeOfFlight, "MM/DD/YYYY").format("MM/DD/YYYY");
                        }
                    }
                }
            }
        }

        function travelerRequired() {
            if (vm.fnol.coverage.coveredTravelers.length > 1) {
                for (var i = 0; i < vm.fnol.coverage.coveredTravelers.length; i++) {
                    if (vm.fnol.coverage.coveredTravelers[i].selected) {
                        return false;
                    }
                }
            }
            return true;
        }

        function openFraudWarning(canSubmit) {
            var modalInstance = $modal.open({
                templateUrl: 'app/fnol/fraudwarning.html',
                controller: 'ModalInstanceCtrl',
                controllerAs: 'fraudCtrl',
                resolve: {
                    content: function () {
                        return vm.fraudWarning;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                vm.fnol.fraud = true;

                if (canSubmit) {
                    submitFnol(true, vm.fnol.fraud);
                }

            });
        }

        function formatFnolForSubmission() {
            if (vm.fnol.coverage.coveredTravelers.length === 1) {
                vm.fnol.coverage.coveredTravelers[0].selected = true;
            }

            vm.fnol.policyNumber = vm.policyNumber;
            vm.formattedClaim = fnolService.formatFnolForClaim(vm.fnol);
        }

        function canClaimFixedCoverage() {
            var canClaim = true;

            if (!policyHasFlights() && coverageRequiresFlights()) {
                canClaim = false;
            }

            return canClaim;
        }

        function policyHasFlights() {
            var hasFlights = false;

            if (vm.claimConfig && vm.claimConfig.flights) {
                hasFlights = vm.claimConfig.flights.length > 0 ? true : false;
            }

            return hasFlights;
        }

        function coverageRequiresFlights() {
            var requiresFlights = false;

            if (vm.fnol && vm.fnol.coverage && vm.fnol.coverage.requires) {
                requiresFlights = vm.fnol.coverage.requires.includes(vm.requiresFlightsConstant);
            }

            return requiresFlights;
        }

        function getPackageByRatingId(ratingId) {
            return portalService.loadProductsPackagesFromClientsApi().then(function (products) {
                return products.packages.filter(function (pkg) {
                    if (pkg.ratingId) {
                        return pkg.ratingId == ratingId;
                    }
                })[0];
            });
        }

        function getEndOfDay() {
            return moment().endOf('day').format();
        }

        function updateTimeshareExpirationDate(policyDetails, packageType) {
            // hack to allow claims on timeshares with expired dates
            if (vm.packageConfiguration && vm.packageConfiguration.packageType === vm.timeshareConstant) {
                vm.claimConfig.expirationDate = getEndOfDay();
            }
        }

        function setDatePickerDates(policyDetails) {
            // getDateStructValue from masked datepicker sdk to match date logic in datepickers
            var localEffectiveDate = getDateStructValue(policyDetails.policy.localEffectiveDate);
            var localExpirationDate = getDateStructValue(policyDetails.policy.localExpirationDate);

            // hack to allow claims on timeshares with expired dates
            if (vm.packageConfiguration && vm.packageConfiguration.packageType === vm.timeshareConstant) {
                vm.datePickers.dateOfLoss.minDate = localEffectiveDate;
                vm.datePickers.dateOfLoss.maxDate = getEndOfDay();
            } else {
                vm.datePickers.dateOfLoss.minDate = localEffectiveDate;
                vm.datePickers.dateOfLoss.maxDate = localExpirationDate;
            }
        }

        function getDateStructValue(newValue) {
            let date = moment(newValue);

            if (date.isValid()) {
                return date.parseZone(newValue).format("MM/DD/YYYY");;
            }
            else {
                return null;
            }
        }

        function init() {
            vm.formLoading = true;
            policiesService.getById(vm.policyNumber).then(function handlePolicySuccess(policyDetails) {
                vm.customerId = policyDetails.policy.primaryTraveler;
                vm.packageName = policyDetails.policy.packageName;
                getPackageByRatingId(policyDetails.policy.packageRatingId)
                    .then(function (pkg) {
                        vm.packageConfiguration = pkg;
                        setDatePickerDates(policyDetails);
                    });

                var defferedPromises = [];

                var fnolPromise = fnolService.getFraudWarning(policyDetails.policy.packageRatingId).then(function handlleSuccess(data) {
                    vm.fraudWarning = data;
                }, function handleError(error) {
                    vm.errorDetails.title = "Error Retrieving Fraud Warning";
                    vm.errorDetails.content = "Error retrieving the fraud warning details for policy# " + vm.policyNumber + ". Please contact Customer Support.";
                    vm.stopFnolError = true;

                });

                var configurationPromise = fnolService.getClaimConfiguration(vm.policyNumber).then(function handleFnolSuccess(data) {
                    vm.claimConfig = data;
                    updateTimeshareExpirationDate();
                }, function handleError(error) {
                    vm.errorDetails.title = "Error Claim Details";
                    vm.errorDetails.content = "Error retrieving claim details for policy# " + vm.policyNumber + ". Please contact Customer Support.";
                    vm.stopFnolError = true;
                });

                defferedPromises.push(configurationPromise);
                defferedPromises.push(fnolPromise);

                $q.all().then(function promisesFinished() {
                    vm.formLoading = false;
                });
            });
        }

        init();

    }
})();