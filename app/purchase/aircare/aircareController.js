
(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name aircareController
     *
     * # aircareController
     *
     * @description
     * controller to support aircare related activities
     */
    angular.module('agentPortal')
        .controller('aircareController', aircareController);

    var flightLookupUrl = "/APIProxy/flights";

    aircareController.$inject = ['$stateParams', '$window', '$scope', '$timeout', 'settings', '$state', '$location', 'portalService', 'utilService', 'sfErrorService', 'agentService',
        'quotesService', 'customersService', 'policiesService', 'aircareService', '$modal', 'storage', 'format', 'statePersister', 'sendQuoteFactory',
        'eligibilityFactory', 'googletagmanager', '$q', 'licenseService', 'intentService', 'eligibilityService', 'tramsService', 'validationService', 'productConstant', 'debugService', 'messageDisplayService'];

    function aircareController($stateParams, $window, $scope, $timeout, settings, $state, $location, portalService, utilService, sfErrorService, agentService,
        quotesService, customersService, policiesService, aircareService, $modal, storage, format, statePersister, sendQuoteFactory,
        eligibilityFactory, googletagmanager, $q, licenseService, intentService, eligibilityService, tramsService, validationService, productConstant, debugService, messageDisplayService) {

        var vm = this;

        vm.forms = [];

        vm.maxMultiFlights = parseInt(global_echo_maxMultiFlights);
        vm.canContinue = true;
        vm.timer = null;
        vm.agents = [];
        vm.popup = {};
        vm.popup.message = "Popup Message";
        vm.confirm = {};
        vm.confirm.message = "Confirm Message";
        vm.confirmoptions = {};
        vm.confirmoptions.mainmessage = "Confirm Message";
        vm.readonly = false;
        vm.step = 0;
        vm.page = "travelers";
        vm.validatingFlights = false;
        vm.dateFormat = settings.date.format;
        vm.receiptState = {};
        vm.receiptState.customForm = [];

        vm.addCustomer = function () {
            vm.showCustomerSearch = true;
        }

        vm.mapCustomer = function (customer) {
            vm.customerSearchMessage = "Update from Customers List";
            vm.state.customer = customer;
            vm.populateCustomer();
            vm.showCustomerSearch = false;
            vm.customerSearchText = '';
            storage.set("updateCustomerMessage", true);
        }

        vm.getRowIndexClass = function (number) {
            return utilService.isOddIndexNumber(number) ? 'odd' : '';
        }

        vm.getDataRowClass = function (acknowledgements) {
            return acknowledgements && acknowledgements.length ? 'view-acknowledgements-data' : '';
        }

        vm.receiptDepartureDate = function () {
            if (!hasPurchasedPolicy()) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.state.policy.policy.departureDates.localized.dateString) +
                        ' ' + vm.state.policy.policy.departureDates.timeZoneAbbreviation;
        };

        vm.receiptReturnDate = function () {
            if (!hasPurchasedPolicy()) {
                return null;
            }

            return format.getDisplayDateStringFromIsoString(vm.state.policy.policy.returnDates.localized.dateString) +
                        ' ' + vm.state.policy.policy.returnDates.timeZoneAbbreviation;
        };

        vm.isCustomSession = function () {
            if (storage.get("isCustomSession")) {
                return true;
            }

            return false;
        }

        vm.loadTramsReceipt = function () {
            console.log('Reloading page');

            storage.set("isCustomSession", false);
            console.log('iscustomSession: ' + storage.get("isCustomSession"));

            // Stop debug logging - DEBUGGING ONLY
            console.log('Ending logging');
            //debugService.stopDebug();


            // Post Back
            window.location.href = '/tramsreceipt';
        }

        function hasPurchasedPolicy() {
            return (vm.state && vm.state.policy && vm.state.policy.policy &&
                    vm.state.policy.policy.departureDates && vm.state.policy.policy.returnDates);
        }

        /**
         * @description
         * initialization ...
         */
        vm.initDefaultState = function () {
            vm.state = {
                primaryTravelerIsPolicyBuyer: true,
                billing: {
                    name: null,
                    address1: null,
                    address2: null,
                    city: null,
                    stateOrProvince: null,
                    postalCode: null,
                },
                customer: null,
                eligibilityPassed: false,
                flights: [],
                generatedQuote: null,
                invalidflights: [],
                invalidSteps: [],
                packageId: null,
                priceQuote: null,
                quote: null,
                quoteId: null,
                traveler: {
                    firstName: null,
                    lastName: null,
                    dateOfBirth: null,
                    dateOfBirthDatePicker: false,
                    emailAddress: null,
                    noEmailAddress: false,
                    phoneNumber: null,
                    state: statePersister.retrieve(),
                    address: {
                        address1: null,
                        address2: null,
                        city: null,
                        state: null,
                        postalCode: null,
                    }
                },
                policyBuyer: getPolicyBuyerModel(),
                travelers: [],
                validSteps: []
            };

            vm.title = "Purchase AirCare";
            vm.minStep = 1;
            vm.maxStep = 4;

            if ($stateParams.quoteId != null && $stateParams.quoteId.length > 0) {
                vm.state.quoteId = $stateParams.quoteId;
            }

            if ($stateParams.customerId != null && $stateParams.customerId.length > 0) {
                vm.state.customerId = $stateParams.customerId;
            }
            if ($location.$$search.requestId != null && $location.$$search.requestId.length > 0) {
                vm.state.requestId = $routeParams.requestId;
            }
        };

        function getPolicyBuyerModel() {
            return {
                firstName: null,
                lastName: null,
                dateOfBirth: null,
                dateOfBirthDatePicker: false,
                emailAddress: null,
                noEmailAddress: false,
                phoneNumber: null,
                address: {
                    address1: null,
                    address2: null,
                    city: null,
                    state: null,
                    postalCode: null,
                }
            };
        }

        vm.canEmailQuote = function canEmailQuote() {
            return vm.state.canEmailQuote && !vm.state.traveler.noEmailAddress;
        }

        vm.loadQueue = [];

        if ($stateParams.page != null && $stateParams.page.length > 0) {
            vm.page = $stateParams.page;
        }

        vm.pages = ["travelers", "flights", "address", "payment", "confirm"];

        /**
         * @description
         * stores state information to local storage .. 
         */
        vm.storeState = function () {
            storage.set('aircare.state', vm.state);
        };

        /**
         * @description
         * adds default flight for fresh quotes
         */
        vm.addDefaultFlight = function () {
            if (vm.state.quote == null && vm.state.flights.length == 0) {
                vm.addFlight();
            }
        };

        $scope.keypressCallback = function (event) {
            if (event.keyCode == 8 || event.keyCode == 46) {
                var element = angular.element('#' + event.target.id);
                $timeout(function () {
                    element.triggerHandler('input');
                });
            }
        };

        /**
         * @description
         * On change event for no email addess checkbox, clears email when value is true
         */
        vm.onNoEmailAddressChange = function onNoEmailAddressChange(noEmailAddress) {
            if (noEmailAddress) {
                vm.state.traveler.emailAddress = null;
            }
        };

        /**
         * @description
         * On change event for primary traveler email, sets noEmailAddress to false when there is a value set
         */
        vm.onPrimaryTravelerEmailAddressKeyUp = function onPrimaryTravelerEmailAddressKeyUp(event) {
            // use key up instead of change because the html input[type=email] only throws the change event when you type the first character after the @ char
            // for example if you type 'abc@d' the change event will only fire once you type d
            if (vm.state.traveler.noEmailAddress && event && event.target && event.target.value && event.target.value.length > 0) {
                vm.state.traveler.noEmailAddress = false;
            }
        };

        /**
         * @description
         * initializaiton work, restoring local storage state to in-memory state if required
         */
        vm.init = function () {
            vm.initDefaultState();
            utilService.setConstants(vm);
            var restore = false;

            if ($stateParams.packageId != null) {
                var stateParams = { page: vm.page };
                var state = vm.getContextPath(stateParams);
                vm.initDefaultState();
                if (storage.get('quickQuote')) {
                    convertQuickQuoteToAirCare();
                }
                if (storage.get("isCustomSession")) {
                    convertCustomQuoteToAirCare();
                }
                vm.state.packageId = $stateParams.packageId;
                vm.redirect(state, stateParams);
            } else {
                if (storage.get('quickQuote')) {
                    storage.remove('quickQuote');
                }
                vm.state.packageId = storage.get('aircare.state').packageId;
            }

            if ($stateParams.customerId) {
                vm.showExistingCustLink = false;
                vm.customerSearchMessage = "";
            }
            else {
                vm.showExistingCustLink = true;
                vm.customerSearchMessage = "Add Traveler from Customers List";
            }

            if (storage.get("showCustomerSearchLink") && storage.get("updateCustomerMessage")) {
                vm.showExistingCustLink = true;
                vm.customerSearchMessage = "Update from Customers List";
            }

            if (vm.state.packageId == null) {
                $state.go('purchase');
            }

            var storedState = storage.get('aircare.state');
            if (storedState != null && $stateParams.packageId == null) {
                vm.state = storedState;
            }

            if (!vm.state.packageStateConfig) {
                vm.state.packageStateConfig = eligibilityService.getPackageStateConfiguration();
            }

            var promises = [];

            promises.push(portalService.getAgentByInternalId(null, false).then(function (agent) {
                vm.loggedInAgent = agent;
                vm.currentAgent = agent;

                var innerPromises = [];

                innerPromises.push(agentService.fetchAgents(agent.agencyId).then(function (results) {
                    if (results) {
                        vm.agents = results;
                    }
                }));

                if (portalService.getInternalAgentAuthId() !== null) {
                    innerPromises.push(portalService.getAgentByInternalId(null, true, true).then(function (overrideAgent) {
                        vm.currentAgent = overrideAgent;
                        return portalService.loadStatesForAgent(vm.currentAgent.agentId).then(function (response) {
                            vm.currentAgent.states = response.states;
                        });
                    }));
                }
                else {
                    innerPromises.push(portalService.loadStatesForAgent(vm.currentAgent.agentId).then(function (response) {
                        vm.currentAgent.states = response.states;
                    }));
                }

                return $q.all(innerPromises).then(function () { });
            }));

            promises.push(portalService.loadStates().then(function (response) {
                vm.states = response.states;
                vm.state.stateOptions = vm.states;
            }));

            promises.push(portalService.loadProductsAndPackages().then(function (response) {
                vm.products = response.products;
                vm.packages = response.packages;
            }));

            $q.all(promises).then(function () {
                if (vm.currentAgent.agentCode) {
                    vm.state.agentCode = vm.currentAgent.agentCode;
                } else {
                    vm.state.agentCode = vm.currentAgent.agentCode;
                }

                var currentPackage = vm.packages.filter(function (p) {
                    return p.id == vm.state.packageId;
                })[0];

                vm.state.packageName = currentPackage.name;
                vm.state.subTitle = currentPackage.subTitle;
                vm.state.ratingId = currentPackage.ratingId;
                vm.state.canEmailQuote = currentPackage.emailQuote;

                //load quote if coming from quotes page 
                if (vm.state.quoteId != null && vm.state.quote == null) {
                    vm.loadQueue.push({ loader: vm.loadQuote, asyncCalls: 2 });
                }

                //load customer as primary traveler if coming from customer's page
                if (vm.state.customerId != null && vm.state.customer == null) {
                    vm.loadQueue.push({ loader: vm.loadCustomer, asyncCalls: 1 });
                }

                //now actually load all the data in async mode 
                vm.loadData(vm.loadQueue);
            });

            // if this is trams
            if (storage.get("isCustomSession")) {
                // Start debug logging - DEBUGGING ONLY
                //debugService.startDebug();
                console.log('Starting logging');
                console.log('iscustomSession: ' + storage.get("isCustomSession"));

                if (vm.state.policy) {
                    console.log('Setting XML policy in cookie');
                    var xmlString = tramsService.getTramsXml(vm.state.policy.policy, vm.state.policy.travelers, 'aircare');
                    document.cookie = "xml=" + encodeURI(xmlString);
                    console.log('Cookie XML: ' + xmlString);

                    storage.set("isCustomSession", false);
                    console.log('iscustomSession: ' + storage.get("isCustomSession"));
                }
            }
        };

        /**
         * @description
         * calls multiple loader functions in async mode and waits until all of them are done.
         * when all are done, then the step-initialization process is invoked
         */
        vm.loadData = function (loadQueue) {
            var completed = 0;
            var asyncCalls = 0;
            if (loadQueue.length > 0) {
                for (var i = 0; i < loadQueue.length; i++) {
                    asyncCalls += loadQueue[i].asyncCalls;
                }
                for (var i = 0; i < loadQueue.length; i++) {
                    loadQueue[i].loader(function () {
                        completed++;
                        if (completed == asyncCalls) {
                            vm.initStep(vm.step);
                        }
                    });
                }
            } else {
                vm.initStep(vm.step);
            }
        };

        /**
         * @description
         * navigate to next step in the wizard
         */
        vm.next = function (stepForm) {
            if (!vm.validate())
                return;

            vm.jump(stepForm, vm.step + 1);
        };

        /**
         * @description;
         * Validate forms
         */
        vm.validate = function validateForms() {
            var isValid = true;
            var step = vm.step;
            var aircare = productConstant.Product.aircare;
            var subForm = getFormByStep(vm.step);
            
            if (step == vm.tabs.aircare.travelers) {
                isValid = validationService.validate(subForm, aircare, step);
            }
            else if (step == vm.tabs.aircare.flights) {
                if (subForm !== undefined) {
                    isValid = validationService.validate(subForm, aircare, step);
                }
            }
            else if (step == vm.tabs.aircare.address) {
                var addressIsValid = validationService.validate(subForm, aircare, step);
                var policyBuyerIsValid = vm.state.primaryTravelerIsPolicyBuyer ? true : validationService.validate(subForm, aircare, step);

                isValid = addressIsValid && policyBuyerIsValid;
            }
            else if (step == vm.tabs.aircare.purchase) {
                isValid = validationService.validate(subForm, aircare, step);
            }

            return isValid;
        }

        /**
         * @description;
         * Get forms by step #
         */
        function getFormByStep(stepNumber) {
            var subForm = $scope.aircareForm;

            if (vm.step == vm.tabs.aircare.travelers) {
                return subForm.travelerInfoForm.stepForm.travelerForm;
            }
            else if (vm.step == vm.tabs.aircare.flights) {
                return subForm.flightDetailsForm.stepForm.flightForm;
            }
            else if (vm.step == vm.tabs.aircare.address) {
                return subForm.travelerAddressForm.stepForm.addressForm;
            }
            else if (vm.step == vm.tabs.aircare.purchase) {
                return subForm.aircarePaymentForm.stepForm.paymentForm;
            }

            return null;
        }

        /**
         * @description
         * navigates to previous page in the wizard
         */
        vm.previous = function (stepForm) {
            vm.jump(stepForm, vm.step - 1);
        };

        /**
         * @description
         * generic jump implementation to any adhoc step
         * called from next/previous calls as well
         */
        vm.jump = function (stepForm, step) {
            var travelerError = null;
            if (vm.step == vm.tabs.aircare.travelers && !stepForm.$invalid && vm.state.customer == null) {
                travelerError = vm.checkPrimaryTraveler(vm.state.traveler);
            }

            if (travelerError == null) {
                //should be able to jump to previous steps anytime
                if (step < vm.step) {
                    vm.jumpUnconditionally(step);
                } //or if form is valid, consider moving forward 
                else if (stepForm != null && !stepForm.$invalid && vm.canContinue) {
                    vm.removeInvalidStep(vm.step);
                    //call on leave validations and if succeed, then only jump forward
                    vm.onLeaveStep(vm.step, vm.jumpForward, step);
                } else {
                    //mark the current step invalid
                    vm.addInvalidStep(vm.step);
                }
            }
        };

        /**
         * @description
         * unconditionally jumps to step+1, i.e., forwards a step on the wizard
         * typically called when current step is all 'ready' (i.e., valid) to be left
         */
        vm.jumpForward = function (step) {
            for (var i = vm.step; i <= step; i++) {
                if (vm.isInvalidStep(i) || i == step) {
                    vm.jumpUnconditionally(i);
                    break;
                }
            }
        };

        /**
         * @description
         * redirects the user to different state, without any validations, after storing state information
         */
        vm.redirect = function (state, params) {
            vm.storeState();
            $state.go(state, params);
        };

        /**
         * @description
         * unconditionally performs jump, typically called internally, after performing all validations
         * prior to jumping to any adhoc step.
         */
        vm.jumpUnconditionally = function (step) {
            vm.storeState();
            vm.step = step;
            vm.page = vm.pages[vm.step - 1];
            var stateParams = { page: vm.page };
            var state = vm.getContextPath(stateParams);
            $state.go(state, stateParams);
        };

        /**
         * @description
         * returns context-path based on the incoming URL information captured into state variables.
         */
        vm.getContextPath = function (params) {
            if (vm.state.quoteId != null) {
                params.quoteId = vm.state.quoteId;
                return 'purchaseAirCareQuote';
            }
            if (vm.state.customerId != null) {
                params.customerId = vm.state.customerId;
                return 'purchaseAirCareCustomer';
            }

            return 'purchaseAirCare';
        };


        /**
         * @description
         * initializes step in the wizard
         */
        vm.initStep = function (step) {
            vm.readonly = false;
            switch (vm.page) {
                case "travelers":
                    vm.step = vm.tabs.aircare.travelers;
                    getCoverageDescription();
                    break;
                case "flights":
                    vm.step = vm.tabs.aircare.flights;
                    vm.addDefaultFlight();
                    getCoverageDescription();
                    break;
                case "address":
                    vm.step = vm.tabs.aircare.address;

                    if (vm.state.traveler.state) {
                        vm.state.traveler.address.state = vm.state.traveler.state;
                    }

                    break;
                case "payment":
                    vm.step = vm.tabs.aircare.purchase;

                    if (vm.state.primaryTravelerIsPolicyBuyer) {
                        vm.state.policyBuyer = vm.state.traveler;
                    }

                    if (vm.state.policyBuyer.firstName && vm.state.policyBuyer.lastName) {
                        var travelerFullName = vm.state.policyBuyer.firstName + " " + vm.state.policyBuyer.lastName
                        vm.state.billing.name = (travelerFullName.length <= 50 ? travelerFullName : "");
                    }

                    if (vm.state.policyBuyer.address.state) {
                        vm.state.billing.stateOrProvince = vm.state.policyBuyer.address.state;
                    }

                    vm.state.billing.address1 = vm.state.policyBuyer.address.address1;
                    vm.state.billing.address2 = vm.state.policyBuyer.address.address2;
                    vm.state.billing.city = vm.state.policyBuyer.address.city;
                    vm.state.billing.postalCode = vm.state.policyBuyer.address.postalCode;
                    vm.state.billing.email = vm.state.policyBuyer.emailAddress;

                    vm.checkEligibility();
                    getCoverageDescription();
                    break;
                case "receipt":
                    vm.step = 5;

                    // format dates of flights based on local dates
                    for (var i = 0; i < vm.state.policy.flights.length; i++) {
                        vm.state.policy.flights[i].departureDate = format.getDisplayDateFromIsoDateTimeString(vm.state.policy.flights[i].localDepartureDate);
                        vm.state.policy.flights[i].arrivalDate = format.getDisplayDateFromIsoDateTimeString(vm.state.policy.flights[i].localArrivalDate);
                    }

                    if (storage.get("isCustomSession")) {
                        createHiddenForm();
                    }

                    break;
                default:
                    vm.step = 1;
                    break;
            }

            if (vm.loggedInAgent.isSuperUser && vm.state.quote) {
                vm.state.agentCode = vm.state.quote.policy.agentCode;
            }

            if (vm.step != 5) {
                googleTagManagerCheckout();
            }
            else {
                googleTagManagerPolicyPurchased();
            }
        };

        /**
         * @description
         * sends the ecommerce data to google tag manager when policy is purchased
         */
        function googleTagManagerPolicyPurchased() {
            var flightsLength = vm.state.flights.length;
            var tripOrigination = ((flightsLength > 0) ? vm.state.flights[0].flightInfo.departureAirportCode : "");
            var tripStartDate = ((flightsLength > 0) ? vm.state.flights[0].flightInfo.departureDate : "");
            var tripDestination = ((flightsLength > 0) ? vm.state.flights[(flightsLength - 1)].flightInfo.arrivalAirportCode : "");
            var fullPackage = $.grep(vm.packages, function (pack) {
                return pack.id == vm.state.packageId
            })[0];

            var packageName = fullPackage.name;
            var productName = fullPackage.productName;
            var packageSubtitle = fullPackage.subTitle;

            googletagmanager.newPolicyPurchased(vm.state.policy.policy.policyNumber, vm.state.policy.policy.submissionChannel, vm.state.policy.policy.premium, vm.state.policy.policy.tax,
                                    packageName, productName, packageSubtitle, vm.state.priceQuote.travelers.length, 0,
                                    tripOrigination, tripDestination, tripStartDate, vm.loggedInAgent.accountName);
        }

        /**
         * @description
         * sends the ecommerce data to google tag manager through purchase path
         */
        function googleTagManagerCheckout() {
            var packageName = '';
            var policyNumber = '';
            var productName = '';
            var packageSubtitle = '';
            var tripCost = 0;
            var submissionType = '';
            var packageRevenue = '';
            var flightsLength = vm.state.flights.length;
            var quantity = 1;
            var tripOrigination = ((flightsLength > 0 && vm.state.flights.flightNumber) ? vm.state.flights[0].flightInfo.departureAirportCode : "");
            var tripStartDate = ((flightsLength > 0 && vm.state.flights.flightNumber) ? vm.state.flights[0].flightInfo.departureDate : "");
            var tripDestination = ((flightsLength > 0 && vm.state.flights.flightNumber) ? vm.state.flights[(flightsLength - 1)].flightInfo.arrivalAirportCode : "");

            if (vm.state.priceQuote && vm.state.priceQuote.package) {
                packageName = vm.state.priceQuote.package.name;
                productName = vm.state.priceQuote.package.productName;
                packageSubtitle = vm.state.priceQuote.package.subTitle;
                submissionType = vm.state.priceQuote.submissionChannel;
                packageRevenue = vm.state.priceQuote.totalPrice;
            } else {
                var fullPackage = $.grep(vm.packages, function (pack) {
                    return pack.id == vm.state.packageId
                })[0];

                packageName = fullPackage.name;
                productName = fullPackage.productName;
                packageSubtitle = fullPackage.subTitle;

            }

            if (vm.state.priceQuote && vm.state.priceQuote.policyNumber) {
                policyNumber = vm.state.priceQuote.policyNumber;
            }

            if (vm.travelers && vm.travelers.length) {
                quantity = (vm.travelers.length + 1);
            }

            googletagmanager.newPolicyPurchaseCheckout(vm.step, packageName, policyNumber, packageRevenue, productName,
                                packageSubtitle, quantity, tripCost, tripOrigination, tripDestination,
                                tripStartDate, vm.loggedInAgent.accountName, submissionType);
        }

        /**
         * @description
         * performs on-leave validation on current step, before allowing user to jump elsewhere
         */
        vm.onLeaveStep = function (step, callBack, args) {
            switch (vm.step) {
                case 1:
                    vm.refreshPrice(callBack, args);
                    break;
                case 2:
                    // Don't remove this step 
                    vm.refreshPrice(callBack, args);
                    break;
                default:
                    callBack(args);
                    break;
            }
        };

        /**
         * @description
         * checks eligibility of the quote
         */
        vm.checkEligibility = function (successCallback, args) {
            var quote = null;
            if (vm.state.quote != null) {
                quote = vm.state.quote;
            }
            if (vm.state.priceQuote != null) {
                quote = vm.state.priceQuote;
            }
            if (quote != null && !vm.state.eligibilityPassed) {
                intentService.setIntent("Verifying Eligibility ...");
                aircareService.checkEligibility(quote).then(function (response) {
                    intentService.resetIntent();

                    if (response.isEligible) {
                        vm.state.eligibilityPassed = true;

                        if (successCallback != null) {
                            successCallback(args);
                        }
                    } else {
                        vm.handleError(response, "Error while checking trip eligibility.");
                    }
                }, function (error) {
                    vm.handleError(error, "Error while checking eligibility.");
                });
            } else if (successCallback != null) {
                successCallback(args);
            }
        };

        /**
         * @description
         * utility function to perform error handling
         */
        vm.handleError = function (error, message) {
            intentService.resetIntent();
            console.warn(message + " %o", error);

            if (error.eligibilityResults != null) {
                eligibilityFactory.parseEligibilityResponses( error.eligibilityResults, true )
                    .then(function (eligibilityResponse) {
                        if (eligibilityResponse && eligibilityResponse.messages && eligibilityResponse.messages.length > 0) {
                            // display errors to the user
                            var promise = messageDisplayService.promptUserWithMessageModal(eligibilityResponse.messages, eligibilityResponse.recommendation, acceptAcknowledgements);

                            // if the user closes the modal and acknowledgements were accepted,
                            // try doing what the 'next' button would do in order to refresh
                            //  and run eligibility again.
                            promise.then(function (result) {
                                if (result.acknowledgementsWereAccepted) {
                                    // refresh eligibility to get the updated flight ack
                                    vm.refreshPrice();
                                }
                                else if (eligibilityResponse.recommendation && result.continueButtonWasClicked) {
                                    eligibilityResponse.recommendation.action(vm.state);
                                }
                            });
                        }
                    });
            } else if (error.exceptionMessage != null) {
                utilService.showPopup("Error", message + " " + sfErrorService.tryMakeErrorReadable(error.exceptionMessage));
            }
            else if ( error.message != null ) {
                utilService.showPopup("Error", message + " " + sfErrorService.tryMakeErrorReadable(error.message));
            } 
            else {
                utilService.showPopup("Error", " " + message);
            }
        };

        /**
         * Copies the accepted acknowledgements to the quote object.  This currently comes from
         * the message display service, after running eligibility.
         *
         * @param {object[]} acceptedAcknowledgements
         * The acknowledgement objects that the user accepted.
         */
        function acceptAcknowledgements(acceptedAcknowledgements) {
            if (!vm.state.acknowledgements) {
                vm.state.acknowledgements = [];
            }

            if (acceptAcknowledgements && acceptAcknowledgements.length > 0) {
                vm.state.acknowledgements = vm.state.acknowledgements.concat(acceptedAcknowledgements);
            }
        }

        /**
         * @description
         * gets fresh price from server in form of a fresh quote, typically when user
         * hits next on the flights screen, we blindly go get fresh quote for the user with fresh price
         */
        vm.refreshPrice = function (successCallBack, args) {
            vm.state.eligibilityPassed = false;
            vm.state.priceQuote = null;
            if (vm.areFlightsValid()) {
                intentService.setIntent("Getting Price Quote ...");
                aircareService.getPrice(vm.state).then(function (response) {
                    intentService.resetIntent();
                    if (response.quotes != null && response.quotes.length > 0) {
                        vm.state.priceQuote = response.quotes[0];
                        mapFlightDataFromPriceQuote(response.quotes[0]);
                        mapCoverageDataFromPriceQuote(response.quotes[0]);
                        mapPriceQuoteAcknowledgementsToState(response.quotes[0]);

                        vm.state.generatedQuote = null;
                        vm.state.price = vm.state.priceQuote.totalPrice.toFixed(2);
                        vm.storeState();

                        if (successCallBack != null) {
                            successCallBack(args);
                        }
                    } else {
                        vm.handleError(response, "Failed to retrieve the price for the quote.");
                    }
                },
                function (error) {
                    intentService.resetIntent();
                    vm.handleError(error.data, "Failed to retrieve the price for the quote.");
                });
            } else {
                utilService.showPopup("Error", "Quote is no longer valid.  One or more flights are no longer valid.");
            }
        };

        function mapFlightDataFromPriceQuote(priceQuoteResponse) {
            // the quoting method returns flight data that we need on purchase/bind-- the departure and arrival airport timezones.
            // map those to the flight objects we currently have.
            if (!priceQuoteResponse || !priceQuoteResponse.flightLegs || priceQuoteResponse.flightLegs.length < 1 || !vm.state.flights || vm.state.flights.length < 1) {
                // do nothing if no flights are involved, yet.
                return;
            }

            // both price quote and the internal state have flights. map the data.
            for (var i = 0; i < priceQuoteResponse.flightLegs.length; i++) {
                var pqFlight = priceQuoteResponse.flightLegs[i];

                // search the customers entered flight data.
                for (var j = 0; j < vm.state.flights.length; j++) {
                    var userFlight = vm.state.flights[j];
                    var userFlightInfo = vm.state.flights[j].flightInfo;

                    if (pqFlight.airlineCode === userFlightInfo.airlineCode &&
                                pqFlight.flightNumber === userFlightInfo.flightNumber &&
                                pqFlight.departureDate === userFlightInfo.departureDate) {
                        // match was found. update the flight info on the user's flight with
                        //  the data that was pulled back with the quote.
                        userFlightInfo.arrivalTimezone = pqFlight.arrivalTimezone;
                        userFlightInfo.departureTimezone = pqFlight.departureTimezone;
                        userFlight.arrivalTimezone = pqFlight.arrivalTimezone;
                        userFlight.departureTimezone = pqFlight.departureTimezone;

                        // map the flight acknowledgements
                        userFlight.acknowledgements = pqFlight.acknowledgements;

                        // break the for loop.
                        break;
                    }
                }
            }
        }

        function mapCoverageDataFromPriceQuote(priceQuoteResponse) {
            // exit early if there are no coverages or travelers.
            if (!vm.state.coverages || !priceQuoteResponse || !priceQuoteResponse.travelers) {
                return;
            }

            // find the primary traveler in the response's traveler list.
            var responsePrimaryTraveler = null
            for (var i = 0; i < priceQuoteResponse.travelers; i++) {

                // it looks like the middleware is returning "True" as a string...
                if (priceQuoteResponse.travelers[i].isPrimary === 'True') {
                    responsePrimaryTraveler = priceQuoteResponse.travelers[i];
                    break;
                }
            }

            // if there's no primary traveler or no coverages on the primary traveler (on the response), exit.
            if (!responsePrimaryTraveler || !responsePrimaryTraveler.coverages) {
                return;
            }

            // copy over acknowledgements from the primary traveler to the primary traveler's coverages in the state object.
            for (var i = 0; i < vm.state.coverages.length; i++) {
                var tripCoverage = vm.state.coverages[i];

                // clear previous acknowledgements.
                tripCoverage.acknowledgements = [];

                for (var j = 0; j < responsePrimaryTraveler.coverages.length; j++) {
                    var quoteCoverage = responsePrimaryTraveler.coverages[j];

                    // copy acknowledgements if the rating IDs match up.
                    if (tripCoverage.ratingId === quoteCoverage.ratingId) {
                        tripCoverage.acknowledgements = quoteCoverage.acknowledgements;
                    }
                }
            }
        }

        function mapPriceQuoteAcknowledgementsToState(priceQuoteResponse) {
            if (priceQuoteResponse.acknowledgements) {
                vm.state.acknowledgements = priceQuoteResponse.acknowledgements;
            }
            else {
                vm.state.acknowledgements = [];
            }
        }

        /**
         * @description
         * checks whether all flights have been marked valid (i.e., by performing per-flight validation earlier)
         */
        vm.areFlightsValid = function () {
            return $.grep(vm.state.flights, function (flight) {
                return flight.invalid;
            }).length == 0;
        };

        /**
         * @description
         * Adds an additional traveler to the list
         */
        vm.addTraveler = function () {
            vm.state.travelers.push({
                firstName: null,//"Secondary",
                lastName: null,//"Traveler "+vm.state.travelers.length,
                dateOfBirth: null//'01/01/1980'
            });
        };

        /**
         * @description
         * removes the additional traveler from the list
         */
        vm.removeTraveler = function (index) {
            vm.state.travelers.splice(index, 1);
        };

        /**
         * @description
         * adds the flight to the list...
         */
        vm.addFlight = function () {
            var newFlight = getNewFlight();
            vm.state.flights.push(newFlight);
        };

        /**
         * @description
         * removes the flight from the list
         */
        vm.removeFlight = function (index) {
            if (vm.state.flights.length > 1) {
                var flightBeingRemoved = vm.state.flights[index];
                vm.removeInvalidFlight(flightBeingRemoved);
                vm.state.flights.splice(index, 1);
            } else {
                vm.state.flights[0] = getNewFlight();
            }
        };

        function getNewFlight() {
            var newFlight = {
                airline: {
                    code: null,//'UA',
                    displayName: null,//'United Airlines (UA)',
                    name: null,//'United Airlines'
                },
                flightNumber: null,
                flightDate: null,
                invalid: false,
                flightInfoOptions: []
            };
            return newFlight;
        }

        /**
         * @description
         * validates the flight information for a given flight
         * basically attaches valid flightInfo objects to the flight object
         * in some cases there may be multiple, so user gets to pick one of them via UI
         */
        vm.validateFlight = function (index, isFieldPristine) {
            // no need to revalidate the flight if the field was blurred yet still unchanged.
            if (isFieldPristine){
                return;
            }

            // else, clear out the available flight legs (info options) 
            //  and the selected flight leg (flightinfo).
            vm.state.flights[index].flightInfoOptions = [];
            vm.state.flights[index].flightInfo = null;

            // clear out any previous acknowledgements.
            vm.state.flights[index].acknowledgements = [];

            if (vm.timer) {
                $timeout.cancel(vm.timer);
            }
            vm.timer = $timeout(function () {
                vm.validateFlightNow(index);
            }, 1000);
        };

        vm.flightDataChanged = function (flight) {
            // if the flight data changed, remove the acknowledgements
            if (flight && flight.acknowledgements && flight.acknowledgements.length > 0) {
                flight.acknowledgements = [];

                // the flight previously had acks.  refresh the price so the quote updates
                //  and removes the old ack.
                vm.refreshPrice();
            }

            return true;
        }

        vm.validateFlightNow = function (index) {
            vm.validatingFlights = true;
            var flight = vm.state.flights[index];
            flight.invalid = false;
            if (vm.isFlightReadyToBeValidated(flight)) {
                intentService.setIntent("Validating Flights...");
                portalService.postJsonToURL(flightLookupUrl, {
                    airlineCode: flight.airline.code,
                    flightNumber: flight.flightNumber,
                    departureDate: moment(flight.flightDate).format("YYYY-MM-DD")
                }).then(function (data) {
                    intentService.resetIntent();
                    var flightLegs = data.flights;

                    // dropdown options...
                    flight.flightInfoOptions = flightLegs;

                    if (flightLegs.length > 0) {
                        updateIncomingFlightLegData(flightLegs);

                        if (!vm.state.quote) {
                            flight.flightInfo = flightLegs[0];
                        }
                        else {
                            for (var i = 0; i < flightLegs.length; i++) {
                                if (flightLegs[i].departureAirportCode === flight.flightInfo.departureAirportCode
                                    && flightLegs[i].flightNumber === flight.flightInfo.flightNumber
                                    && flightLegs[i].airlineCode === flight.flightInfo.airlineCode) {
                                    flight.flightInfo = flightLegs[i];
                                    break;
                                }
                            }
                        }
                        // need to select the appropriate flight leg, in case a flight number has two flights in the same day.
                        // do this only if loading from a quote... otherwise, select the first leg.
                        if (flight.flightInfo) {
                            // validating a new flight.
                            selectInitialFlightLeg(flight);
                        }

                        selectFlight(flight);

                        vm.removeInvalidFlight(flight);
                    } else {
                        vm.addInvalidFlight(flight);
                    }
                    vm.validatingFlights = false;
                }, function (error) {
                    vm.validatingFlights = false;
                    intentService.resetIntent();
                    vm.addInvalidFlight(flight);
                    vm.validatingFlights = false;
                });
            } else {
                flight.invalid = false;
                flight.flightInfoOptions = [];
                vm.validatingFlights = false;
            }
        };

        // maps the data coming in from the flights service so it is in the expected format for the page.
        function updateIncomingFlightLegData(flightLegs) {
            for (var i = 0; i < flightLegs.length; i++) {
                var leg = flightLegs[i];

                //set display names for various flight options available...
                leg.displayName = leg.departureAirportCode + "  to  " + leg.arrivalAirportCode;

                // map the string value of the arrival and departure dates from the flight service 
                // into the local version of the dates.  the local version is what is passed into quoting.
                // in the case of flight service, the arrival/departure ARE the local datetimes for the flights.
                leg.localDepartureDate = leg.departureDate;
                leg.localArrivalDate = leg.arrivalDate;

                // now map the local date strings to date objects. The time gets lopped off so we don't have issues
                //  with the date changing between timezones. 
                //  this is because the datepickers expect date objects.
                //  using strings can throw off the dates shown in the datepicker.
                // leg.departureDate = format.getDateFromIsoDateString( leg.localDepartureDate );
                // leg.arrivalDate = format.getDateFromIsoDateString( leg.localArrivalDate );
            }
        }

        // selects the correct flight leg based on 
        //  the original policy information.
        //  Purpose: Delta flight 199 had two legs in the same day.
        //          I purchased the second leg.  the original code defaulted
        //          the leg during edit to the first leg.
        //          This fix will select whichever the purchase leg was,
        //          not the first leg in the array.
        //  You should only call this at load, but it won't hurt to call it
        //  somewhere else as long as it is before vm.selectFlight().
        function selectInitialFlightLeg(quoteFlight) {
            if (!quoteFlight || !quoteFlight.flightInfoOptions) {
                return;
            }

            var arrivalCode = quoteFlight.arrivalAirportCode;
            var departureCode = quoteFlight.departureAirportCode;

            // truncate the departure date string when comparing dates between the flight specified and the
            //  flight legs returned from the flight service.
            var departureDateString = format.getIsoDateStringFromIsoDateTimeString(quoteFlight.localDepartureDate);
            var flightNumber = quoteFlight.flightNumber;

            for (var i = 0; i < quoteFlight.flightInfoOptions.length; i++) {
                var leg = quoteFlight.flightInfoOptions[i];

                // truncate the departure date string when comparing dates between the flight specified and the
                //  flight legs returned from the flight service.
                var legDepartureDateString = format.getIsoDateStringFromIsoDateTimeString(leg.localDepartureDate);

                if (arrivalCode === leg.arrivalAirportCode && departureCode === leg.departureAirportCode &&
                        departureDateString === legDepartureDateString) {
                    quoteFlight.flightInfo = leg;
                    break;
                }
            }
        }

        function selectFlight(flight) {
            //set the codes
            flight.arrivalAirportCode = flight.flightInfo.arrivalAirportCode;
            flight.departureAirportCode = flight.flightInfo.departureAirportCode;

            // map the flight date/time that is local to the airports. this is sent in when quoting.
            flight.localDepartureDate = flight.flightInfo.localDepartureDate;
            flight.localArrivalDate = flight.flightInfo.localArrivalDate;
        }

        /**
         * @description
         * checks if we have all the info available to perform flight validation 
         */
        vm.isFlightReadyToBeValidated = function (flight) {
            return flight.airline != null
                && flight.airline.displayName != null
                && flight.airline.displayName.length > 0
                && flight.airline.code != null
                && flight.flightNumber != null && flight.flightDate != null
                && moment(flight.flightDate).isValid()
                && flight.airline.displayName == flight.airline.name + " (" + flight.airline.code + ")";
        };

        /**
         * @description
         * marks flight as invalid by adding it to the list of invalid flights
         */
        vm.addInvalidFlight = function (flight) {
            flight.flightInfo = null;
            flight.invalid = true;

            var invalidFlights = vm.state.invalidflights;
            var foundIndex = invalidFlights.indexOf(flight);
            if (foundIndex == -1) {
                invalidFlights.push(flight);
            }
            googletagmanager.flightNotFoundError(flight.flightDate, flight.airline.name, flight.flightNumber);
        };

        /**
         * @description
         * removes flight from list of invalid flights
         */
        vm.removeInvalidFlight = function (flight) {
            flight.invalid = false;
            var invalidFlights = vm.state.invalidflights;
            var foundIndex = invalidFlights.indexOf(flight);
            if (foundIndex > -1) {
                invalidFlights.splice(foundIndex, 1);
            }
        };

        /**
         * @description
         * marks step as invalid step by adding it to the list of invalid steps
         */
        vm.addInvalidStep = function (step) {

            var invalidSteps = vm.state.invalidSteps;
            var foundIndex = invalidSteps.indexOf(step);
            if (foundIndex == -1) {
                invalidSteps.push(step);
            }
        };

        /**
         * @description
         * returns true if given step has been marked invalid
         */
        vm.isInvalidStep = function (step) {
            var invalidSteps = vm.state.invalidSteps;
            var foundIndex = invalidSteps.indexOf(step);
            return (foundIndex > -1);
        };

        /**
         * @description
         * removes step from list of invalid steps
         */
        vm.removeInvalidStep = function (step) {
            var invalidSteps = vm.state.invalidSteps;
            var foundIndex = invalidSteps.indexOf(step);
            if (foundIndex > -1) {
                invalidSteps.splice(foundIndex, 1);
            }
        };

        /**
         * @description
         * loads quote information, when coming from quotes path
         */
        vm.loadQuote = function (callback) {
            quotesService.getById(vm.state.quoteId).then(function (quote) {
                if (quote.policy != null && quote.policy.quoteId === vm.state.quoteId) {
                    vm.state.quote = quote;
                    vm.state.price = quote.policy.premium;
                    vm.populateQuote(callback);
                } else {
                    console.warn("[aircareController] : failed to retrieve quote successfully");
                    $state.go('purchase');
                }
            });
        };

        /**
         * @description
         * loads customer information, i.e., when coming from customers path
         */
        vm.loadCustomer = function (callback) {
            customersService.getById(vm.state.customerId).then(function (customer) {
                vm.fixCustomerAddress(customer);
                vm.state.customer = customer;
                vm.populateCustomer(callback);
            });
        };

        /**
         * @description
         * If the customer does not have an address, add the state from the policy address
         */
        vm.fixCustomerAddress = function (customer) {
            if (customer && !customer.address && vm.state.quote && vm.state.quote.policy && vm.state.quote.policy.policyAddress && vm.state.quote.policy.policyAddress.stateOrProvince) {
                customer.address = { stateOrProvince: vm.state.quote.policy.policyAddress.stateOrProvince };
            }

            return customer;
        };

        /**
         * @description
         * populates the loaded quote from backend into the in-memory structures containing
         * flights, travelers etc.
         */
        vm.populateQuote = function (callback) {
            var promises = [];

            for (var i = 0; i < vm.state.quote.travelers.length; i++) {
                var traveler = vm.state.quote.travelers[i];
                if (traveler.isPrimary) {
                    var customerId = vm.state.quote.policy && vm.state.quote.policy.primaryTraveler ? vm.state.quote.policy.primaryTraveler : traveler.travelerAccount;
                    promises.push(customersService.getById(customerId).then(function (customer) {
                        vm.fixCustomerAddress(customer);
                        vm.state.customer = customer;
                        vm.populateCustomer(callback);
                    }));
                } else {
                    vm.addTraveler();
                    var newTraveler = vm.state.travelers[vm.state.travelers.length - 1];
                    newTraveler.firstName = traveler.firstName;
                    newTraveler.lastName = traveler.lastName;
                    newTraveler.dateOfBirth = moment(traveler.birthDate).format("MM/DD/YYYY");
                }
            }

            loadPolicyAddress(vm.state.quote.policy.policyAddress, vm.state.traveler.address);
            vm.state.traveler.state = vm.state.quote.policy.policyAddress.stateOrProvince;

            $q.all(promises).then(function () {
                for (var i = 0; i < vm.state.quote.flights.length; i++) {
                    var flight = vm.state.quote.flights[i];
                    vm.addFlight();
                    var newFlight = vm.state.flights[vm.state.flights.length - 1];
                    newFlight.flightInfo = flight;
                    flight.displayName = flight.departureAirportCode + " => " + flight.arrivalAirportCode;
                    newFlight.flightNumber = parseInt(flight.flightNumber, 10);
                    newFlight.flightDate = format.getLocalDateDisplayString(flight.localDepartureDate, 'MM/DD/YYYY');
                    newFlight.airline = {
                        code: flight.airlineCode,
                        displayName: flight.airlineName + " (" + flight.airlineCode + ")",
                        name: flight.airlineName
                    };
                    vm.validateFlightNow(vm.state.flights.length - 1);
                }
                callback();
            });

            function loadPolicyAddress(source, target) {
                if (source && target) {
                    target.address1 = source.address1;
                    target.address2 = source.address2;
                    target.city = source.city;
                    target.postalCode = source.postalCode;
                }
            }
        };

        /**
         * @description
         * look up for statename by given state code
         */
        vm.getStateName = function (stateCode) {
            return $.grep(vm.state.stateOptions, function (option) {
                return option.code == stateCode;
            })[0].name;
        };


        /**
         * @description
         * populates customer as part of primary traveler structure 
         */
        vm.populateCustomer = function (callback) {
            var customerResource = vm.state.customer;

            customerResource.$promise.then(function (customer) {
                vm.state.traveler.accountInfo = customer;
                vm.state.traveler.firstName = customer.firstName;
                vm.state.traveler.lastName = customer.lastName;
                vm.state.traveler.dateOfBirth = moment(customer.birthDate).format("MM/DD/YYYY");
                vm.state.traveler.emailAddress = customer.emailAddress;
                vm.state.traveler.customerId = customer.customerId;
                if (!customer.emailAddress) {
                    vm.state.traveler.noEmailAddress = true;
                }

                if (customer.phoneNumbers && customer.phoneNumbers.length > 0) {
                    vm.state.traveler.phoneNumber = customer.phoneNumbers[0].phoneNumber;
                }

                if (customer.address && !vm.state.quote) {
                    vm.state.traveler.state = customer.address.stateOrProvince ? customer.address.stateOrProvince : null;
                    copyAddress(vm.state.traveler.address, customer.address);
                }

                if (callback) {
                    callback();
                }
            }, function () {
                console.warn("[aircareController] - populateCustomer - failed while retrieving customer.");
            });

            function copyAddress(traveler, customer) {
                if (traveler && customer) {
                    traveler.address1 = customer.address1;
                    traveler.address2 = customer.address2;
                    traveler.city = customer.city;
                    traveler.postalCode = customer.postalCode;
                }
            }
        };

        /**
        * @description
        * shows email quote dialog box, internally stores the quote in the database
        */
        vm.emailQuote = function (aircareForm) {
            if (!vm.validate()) {
                utilService.showPopup("Error", "Quote is no longer valid.  One or more flights are no longer valid.");
                return;
            }
            vm.generateQuoteAfterConfirming(aircareForm, false, sendQuote);
        };

        var sendQuote = function () {
            return sendQuoteFactory.sendQuote(vm.state.generatedQuote);
        };

        /**
        * @description
        * stores quote into database
        */
        vm.saveQuote = function (aircareForm) {
            if (!vm.validate()) {
                utilService.showPopup("Error", "Quote is no longer valid.  One or more flights are no longer valid.");
                return;
            }

            vm.generateQuoteAfterConfirming(aircareForm, true, null);
        };

        /**
        * @description
        * stores state information to local storage after confirming with the user
        */
        vm.generateQuoteAfterConfirming = function (aircareForm, showPopup, successCallBack) {

            vm.refreshPrice(function () {
                vm.generateQuote(showPopup, successCallBack)
            });
        };

        /**
        * @description
        * saves quote in salesforce by persisting the clariondoor quote
        * involves two steps - convert the quote into appropriate format and then save it.
        */
        vm.generateQuote = function (showPopup, successCallBack) {
            intentService.setIntent("Generating Quote ...");
            aircareService.convertQuote(vm.state).then(function (response) {
                intentService.resetIntent();
                response.policy.isSavedQuote = true;
                response.policy.policyAddress.country = "US"; //Temp workaround - converter returns 'United States' here.
                if (response.policy != null) {
                    //convert the quote into salesforce format
                    vm.state.convertedPriceQuote = response;
                    if (vm.state.requestId != null && vm.state.requestId.length > 0) {
                        vm.state.convertedPriceQuote.policy.requestId = vm.state.requestId;
                    }
                    //perform save
                    vm.saveConvertedQuote(showPopup, successCallBack);
                } else {
                    vm.handleError(error, "Error while converting the quote to policy format. ");
                }
            }, function (error) {
                vm.handleError(error, "Error while converting the quote to policy format. ");
            });
        };

        /**
        * @description
        * stores the quote (which has been already converted into salesforce format) into salesforce
        */
        vm.saveConvertedQuote = function (showPopup, successCallBack) {

            aircareService.saveQuote(vm.state).then(function (response) {
                intentService.resetIntent();
                if (response.policy != null) {
                    vm.state.generatedQuote = response;
                    vm.storeState();
                    if (showPopup) {
                        utilService.showPopup("Message", "Quote " + response.policy.quoteNumber + " saved successfully.", 'fa-check-circle fa-icon-medium');
                    }
                    if (successCallBack != null) {
                        successCallBack();
                    }
                } else {
                    vm.handleError(response, "Error while saving the quote. ");
                }
            }, function (error) {
                vm.handleError(error, "Error while saving the quote. ");
            });
        };

        /**
        * @description
        * perform payment processing  after internally saving the quote in the database
        */
        vm.purchaseQuote = function (aircareForm) {
            if (!vm.validate())
                return;

            vm.state.overwriteAgent = false;
            vm.generateQuoteAfterConfirming(aircareForm, false, vm.processPaymentAfterCheckingEligibility);
        };

        /**
        * @description
        * process payment after checking the eligibility of the qutoe for one last time
        */
        vm.processPaymentAfterCheckingEligibility = function () {
            vm.checkEligibility(vm.processPayment);
        };

        /**
        * @description
        * processes the payment information , this is where card gets charged.
        */
        vm.processPayment = function () {
            intentService.setIntent("Processing payment...");
            aircareService.processPayment(vm.state).then(function (response) {
                intentService.resetIntent();

                //response of payment processing API is the officially issued policy!
                if (response.policy != null) {
                    vm.state.policy = response.policy;
                    vm.showReceipt();
                }
                else if (response.canSell == false) {
                    vm.state.overwriteAgent = true;
                    vm.processPaymentAfterCheckingEligibility();
                }
                else {
                    vm.purchaseErrors = response;
                }
            }, function (error) {
                vm.handleError(error, "Error while processing the payment. ");
            });
        };

        /**
        * @description
        * displays receipt of the freshly generated policy to the user
        */
        vm.showReceipt = function () {
            intentService.setIntent("Retrieving Policy ...");

            vm.state.policy.primaryTraveler = vm.findPrimaryTraveler(vm.state.policy.travelers);
            vm.state.policy.secondaryTravelers = vm.findSecondaryTravelers(vm.state.policy.travelers);

            intentService.resetIntent();
            vm.state.policy.primaryCustomer = vm.state.traveler;
            vm.storeState();
            var stateParams = { page: 'receipt' };
            var state = vm.getContextPath(stateParams);
            $state.go(state, stateParams);
        };

        /**
        * @description
        * finds primary traveler amongst list of travelers based on isPrimary=true flag
        */
        vm.findPrimaryTraveler = function (travelers) {
            for (var i = 0; i < travelers.length; i++) {
                if (travelers[i].isPrimary) {
                    return travelers[i];
                }
            }
            return null;
        };

        /**
        * @description
        * finds list of secondary travelers amongst list of all travelers based on isPrimary flag 
        */
        vm.findSecondaryTravelers = function (travelers) {
            var secondaryTravelers = [];
            for (var i = 0; i < travelers.length; i++) {
                if (!travelers[i].isPrimary) {
                    secondaryTravelers.push(travelers[i]);
                }
            }
            return secondaryTravelers;
        };

        vm.openPrimaryTravelerDatePicker = function ($event, sourceObject, attribute) {
            $event.preventDefault();
            $event.stopPropagation();
            sourceObject[attribute] = true;
            toggleTravalerDatePicker(null);
        };

        /**
        * @description
        * opens date pickers for the date fields
        */
        vm.openDatePicker = function ($event, index, attribute) {
            $event.preventDefault();
            $event.stopPropagation();
            for (var i = 0; i < vm.state.flights.length; i++) {
                if (index == i) {
                    vm.state.flights[i][attribute] = true;
                } else {
                    vm.state.flights[i][attribute] = false;
                }
            }
        };

        vm.openTravelerDatePicker = function ($event, index, attribute) {
            $event.preventDefault();
            $event.stopPropagation();
            toggleTravalerDatePicker(index);
            //close primary traveler calender.
            vm.state.traveler.dateOfBirthDatePicker = false;
        };

        function toggleTravalerDatePicker(index) {
            for (var i = 0; i < vm.state.travelers.length; i++) {
                if (index == i) {
                    vm.state.travelers[i].dateOfBirthDatePicker = true;
                } else {
                    vm.state.travelers[i].dateOfBirthDatePicker = false;
                }
            }
        }


        /**
       * @description
       * convert quickquote quote to exactcare
       * from clearing when they are tabbed through for the next step 
       */
        function convertQuickQuoteToAirCare() {
            var quickQuote = storage.get('quickQuote');
            statePersister.stateCode = quickQuote.additionalInfo.residenceState;
            var primaryTraveler = quickQuote.travelers.filter(function (t) {
                return t.isPrimary;
            });

            vm.state.traveler.dateOfBirth = primaryTraveler[0].birthDate ? moment(primaryTraveler[0].birthDate).startOf("day").format('MM/DD/YYYY') : null;
            vm.state.traveler.age = primaryTraveler[0].birthDate ? moment().diff(moment(primaryTraveler[0].birthDate), 'years') : 0;
            vm.state.traveler.state = quickQuote.additionalInfo.residenceState;
            vm.state.destinationCountry = quickQuote.policy.destinationCountry;

            var additionalTraveler = quickQuote.travelers.filter(function (t) {
                return !t.isPrimary;
            });

            for (var i = 0; i < additionalTraveler.length; i++) {
                vm.state.travelers.push({
                    dateOfBirth: additionalTraveler[i].birthDate ? moment(additionalTraveler[i].birthDate).startOf("day").format('MM/DD/YYYY') : null,
                    age: additionalTraveler[i].birthDate ? moment().diff(moment(additionalTraveler[i].birthDate), 'years') : 0
                });
            }
        }

        /**
       * @description
       * convert customsession quote to exactcare
       * from clearing when they are tabbed through for the first time 
       */
        function convertCustomQuoteToAirCare() {
            var customSession = storage.get("customSession");

            //FIll Traveler and additional travelers 
            for (var i = 0; i < customSession.travelers.length; i++) {
                var sessionTraveler = customSession.travelers[i];
                if (sessionTraveler.isPrimary) {
                    vm.state.traveler.firstName = sessionTraveler.firstName;
                    vm.state.traveler.lastName = sessionTraveler.lastName;
                    vm.state.traveler.dateOfBirth = sessionTraveler.birthDate;
                    vm.state.traveler.emailAddress = sessionTraveler.emailAddress;
                    vm.state.traveler.phoneNumber = sessionTraveler.phoneNumber
                    if (customSession.billToAddress && customSession.billToAddress.stateOrProvince) {
                        vm.state.traveler.state = customSession.billToAddress.stateOrProvince;
                    } else {
                        vm.state.traveler.state = customSession.primaryTravelerAddress.stateOrProvince;
                    }
                }
                else {
                    var tempAdditional = {};
                    tempAdditional.firstName = sessionTraveler.firstName;
                    tempAdditional.lastName = sessionTraveler.lastName;
                    tempAdditional.dateOfBirth = sessionTraveler.birthDate;

                    vm.state.travelers.push(tempAdditional);
                }
            }

            if (customSession.flights.length > 0) {
                for (var i = 0; i < customSession.flights.length; i++) {
                    var flight = {};
                    flight.flightDate = customSession.flights[i].departureDate;
                    flight.invalid = false;
                    flight.flightInfoOptions = [];
                    flight.airline =
                            {
                                code: null,//'UA',
                                displayName: null,
                                name: customSession.flights[i].airlineCode
                            };

                    flight.flightNumber = customSession.flights[i].flightNumber;

                    vm.state.flights.push(flight);
                }
            }

            vm.state.billing = {};
            vm.state.billing.address1 = customSession.billToAddress.addressLine1;
            vm.state.billing.address2 = customSession.billToAddress.addressLine2;
            vm.state.billing.city = customSession.billToAddress.city;
            vm.state.billing.postalCode = customSession.billToAddress.postalCode;
            vm.state.billing.stateOrProvince = customSession.billToAddress.stateOrProvince;
        }

        /**
        * @description
        * gets the link for description of coverage based on the selected state. This is done whenever the state changes in step 1.
        */
        function getCoverageDescription() {
            if (vm.state.traveler.state) {
                aircareService.getPackageInformationForState(vm.state.packageId, vm.state.traveler.state).then(function (response) {
                    vm.state.docurl = response.docUri;
                    vm.state.coverages = response.coverages;
                    initCoveragesDisplay();
                });
            }
        };

        /**
         * @description
        * Loads the coverages directive with the information needed.
        */
        function initCoveragesDisplay() {
            vm.coveragesDisplay = {
                docUrl: vm.state.docurl,
                coverages: vm.state.coverages
            }
        }

        /**
         * @description
         * Navigate to policy view page after purchase.
         */
        vm.navigateToPolicyViewFromReceipt = function () {
            if (storage.get("isCustomSession")) {
                // Block Link click for trams
                return;
            }
            $state.go('policiesView', { policyNumber: vm.state.policy.policy.policyNumber });
        };

        /**
        * @description
        * Checks the navigation from traveler to next step.
        */
        vm.checkPrimaryTraveler = function (traveler) {
            var error = null;
            if (vm.agents) {
                var foundAgent = vm.agents.filter(function (a) {
                    return a.email != null && traveler.emailAddress != null && a.email.toLowerCase() == traveler.emailAddress.toLowerCase();
                });

                var tempAgent = null;
                if (foundAgent.length > 0) {
                    tempAgent = JSON.parse(JSON.stringify(foundAgent[0]));
                    if (tempAgent.birthDate == null) {
                        tempAgent.birthDate = moment(traveler.dateOfBirth).startOf("day").format('YYYY-MM-DD');
                    }
                }

                if (tempAgent) {
                    if (tempAgent.firstName.toLowerCase() != traveler.firstName.toLowerCase() || tempAgent.lastName.toLowerCase() != traveler.lastName.toLowerCase() || moment(tempAgent.birthDate).startOf("day").format('YYYY-MM-DD') != moment(traveler.dateOfBirth).startOf("day").format('YYYY-MM-DD')) {
                        var tempFirstName = tempAgent.firstName != undefined ? tempAgent.firstName : traveler.firstName;
                        var tempLastName = tempAgent.lastName != undefined ? tempAgent.lastName : traveler.lastName;

                        error = "It looks as though you've entered an email address associated with your company. Is " + tempFirstName + " " + tempLastName + " the primary traveler on this policy?"
                        var buttons = [
                            {
                                style: "btn btn-lg btn-default btn-cust-sec",
                                action: function (f) {
                                    vm.removeEmail();
                                },
                                name: "No"
                            },
                            {
                                style: "btn btn-lg btn-default btn-cust",
                                action: function (f) {
                                    vm.replaceFromAgent();
                                    if (vm.canContinue)
                                        vm.onLeaveStep(vm.step, vm.jumpForward, vm.step + 1);
                                },
                                name: "Yes"
                            }
                        ];
                        /*
                        utilService.showConfirmPopup("Agent Email Error", error);
                        
                        utilService.showConfirmWithOptionsPopup("Agent Email Error", error, null, buttons);
                        */
                        utilService.showConfirmPrimaryTraveler("Agent Email Error", error, buttons);
                    }
                }
            }
            return error;
        }

        function fillPrimaryDetails(newEmail) {
            if (vm.state.customer || newEmail == "" || !newEmail) {
                return;
            }

            vm.state.emailDetails = null;
            var customerDetails = customersService.getByEmail(newEmail);
            customerDetails.then(function (customer) {
                if (customer) {
                    if (customer.firstName) {
                        vm.state.emailDetails = customer;
                    }
                }
            });
        }

        $scope.$watch('vm.state.packageId', function (oldValue, newValue) {
            if (newValue != oldValue) {
                getCoverageDescription();
                intentService.setIntent("Getting Price Quote ...");
                aircareService.getPrice(vm.state).then(function (response) {
                    intentService.resetIntent();
                    if (response.quotes != null && response.quotes.length > 0) {
                        mapFlightDataFromPriceQuote(response.quotes[0]);
                        mapCoverageDataFromPriceQuote(response.quotes[0]);
                        mapPriceQuoteAcknowledgementsToState(response.quotes[0]);

                        vm.state.priceQuote = response.quotes[0];
                        vm.state.generatedQuote = null;
                        vm.state.price = vm.state.priceQuote.totalPrice.toFixed(2);
                        vm.storeState();
                    }
                    else {
                        vm.handleError(response, "Failed to retrieve the price for the quote.");
                    }
                },
                function (error) {
                    intentService.resetIntent();
                    vm.handleError(error.data, "Failed to retrieve the price for the quote.");
                });
            }
        });

        $scope.$watch('vm.state.traveler.emailAddress', function (newValue, oldValue) {
            if (oldValue != newValue) {
                if (vm.timer) {
                    $timeout.cancel(vm.timer);
                }
                vm.timer = $timeout(function () {
                    fillPrimaryDetails(newValue);
                }, 1000);
            }
        });

        vm.removeEmail = function () {
            vm.state.traveler.emailAddress = null;
        }

        vm.replaceFromAgent = function () {
            var traveler = vm.state.traveler;
            var foundAgent = vm.agents.filter(function (a) {
                return a.email != null && traveler.emailAddress != null && a.email.toLowerCase() == traveler.emailAddress.toLowerCase();
            });

            if (foundAgent.length > 0) {
                foundAgent = JSON.parse(JSON.stringify(foundAgent[0]));
                if (foundAgent.birthDate == null) {
                    foundAgent.birthDate = moment(traveler.dateOfBirth).startOf("day").format('MM/DD/YYYY');
                }
            }
            vm.state.traveler.firstName = foundAgent.firstName;
            vm.state.traveler.lastName = foundAgent.lastName;
            vm.state.traveler.dateOfBirth = moment(foundAgent.birthDate).format('MM/DD/YYYY');
            vm.state.traveler.state = foundAgent.otherAddress.stateOrProvince;
            vm.state.traveler.phoneNumber = foundAgent.phone;

            fillPrimaryDetails(traveler.emailAddress);
        }

        /**
         * @description
         * check if package is available for web purchase
         */
        vm.canEmail = function () {
            if (!vm.state.priceQuote.package.availablePlatform) {
                return false;
            }
            var WebEnabled = vm.state.priceQuote.package.availablePlatform.split(';').filter(function f(a) { return a == 'Web' }).length;

            if (WebEnabled > 0) {
                return true;
            }
            return false;
        }

        /**
         * @description
         * will be called from ambassador login to give agent credit
         */
        vm.onAgentUpdated = function (agentCode) {
            vm.state.agentCode = agentCode;
        };

        /**
         * @description
         * create hidden object and form
         */
        function createHiddenForm() {
            var primaryTraveler = vm.state.traveler;
            var combinedString = primaryTraveler.firstName + " " + primaryTraveler.lastName;
            combinedString += "|" + moment().diff(primaryTraveler.dateOfBirth, 'years');
            combinedString += "|";
            combinedString += "||" + primaryTraveler.emailAddress;
            combinedString += "|primary";
            combinedString += "||||" + primaryTraveler.dateOfBirth.replace('/', '').replace('/', '');
            combinedString += "|0|0|0|||||||0|||";

            var customSession = storage.get("customSession");
            var objCustomPost = [];

            objCustomPost.push({ name: "LoginId", value: customSession.providerLoginId });
            objCustomPost.push({ name: "PassWord", value: customSession.providerPassword });
            objCustomPost.push({ name: "AccountNo", value: customSession.accountNumber });
            objCustomPost.push({ name: "VendorCode", value: customSession.vendorCode });
            objCustomPost.push({ name: "paxCount", value: vm.state.travelers.length + 1 });
            objCustomPost.push({ name: "passenger1", value: combinedString });


            for (var i = 0; i < vm.state.travelers.length; i++) {
                /* Sample "Name|Age|Gender||Email|Retationship|PPNum|PPED|Origin|DOB|0|0|0|CSO|CDP|CSSP|HRLP|HBTPHSN|TEP|0|C|PID|MN" */
                var traveler = vm.state.travelers[i];
                var combinedString = traveler.firstName + " " + traveler.lastName;
                combinedString += "|" + moment().diff(traveler.dateOfBirth, 'years');
                combinedString += "|";
                combinedString += "||";
                combinedString += "|";
                combinedString += "||||" + traveler.dateOfBirth.replace('/', '').replace('/', '');
                combinedString += "|0|0|0|||||||0|||"
                objCustomPost.push({ name: "passenger" + (i + 2), value: combinedString });
            }

            objCustomPost.push({ name: "PhoneNumber", value: vm.state.traveler.phoneNumber });
            objCustomPost.push({ name: "FaxNumber", value: null });
            objCustomPost.push({ name: "CreditCardType", value: null });
            objCustomPost.push({ name: "CreditCardNum", value: vm.state.card.cardNumber });
            objCustomPost.push({ name: "ExpiredDate", value: vm.state.card.expiryMonth + "" + vm.state.card.expiryYear.substr(2, 2) });
            objCustomPost.push({ name: "CardHolder", value: vm.state.card.nameOnCard });
            objCustomPost.push({ name: "BillingAddress", value: vm.state.billing.address1 + vm.state.billing.address2 == null ? "" : " " + vm.state.billing.address2 });
            objCustomPost.push({ name: "BillingCity", value: vm.state.billing.city });
            objCustomPost.push({ name: "BillingState", value: vm.state.billing.stateOrProvince });
            objCustomPost.push({ name: "BillingZip", value: vm.state.billing.postalCode });
            objCustomPost.push({ name: "BillingCountry", value: "US" });
            objCustomPost.push({ name: "Referrer", value: "TRAMS" });
            objCustomPost.push({ name: "SerialNo", value: vm.state.policy.policy.policyNumber });

            //Commented for later story
            vm.receiptState.customForm = objCustomPost;
        }

        vm.policyBuyerSwitchChanged = function (value) {
            if (value !== undefined || value !== null) {
                vm.state.primaryTravelerIsPolicyBuyer = value;

                // clear policy buyer
                if (value === false) {
                    vm.state.policyBuyer = getPolicyBuyerModel();
                }
            }
        }

        vm.init();
    }

})();