(function () {
    'use strict';

    // used to cache all html template files so the app as a whole can be packaged into a single file
    angular.module('agent-portal-templates', []);

    /**
     * @ngdoc module
     * @name agentPortal
     *
     * # agentPortal
     *
     * @description
     * application main module
     */

    angular.module('agentPortal', ['ui.bootstrap', 'ui.router', 'ngResource', 'ngCookies', 'auth0', 'angular-jwt', 'angular-storage', 'angularLocalStorage', 'ngFileUpload', 'app', 'agent-portal-templates', 'browserUpdate', 'ngDropzone', 'newrelic-angular', 'ngRoute']);

    angular.module('agentPortal').config(['$httpProvider', 'authProvider', '$provide', 'jwtInterceptorProvider', agentPortal]);

    function agentPortal($httpProvider, authProvider, $provide, jwtInterceptorProvider) {

        authProvider.init({
            domain: global_auth0_domain,
            clientID: global_auth0_client_id,
            callbackURL: location.pathname + location.search,
            loginState: 'login',
            minutesToRenewToken: -1
        });

        var dateDisplayFormat = 'mm/dd/yyyy';
        var maximumTravelers = 24;

        $provide.constant('settings', {
            timers: {
                quoteWait: 1350,
                afterEdit: 1200,
                afterSelectChoice: 800
            },
            tabs: {
                aircare: {
                    travelers: 1,
                    flights: 2,
                    address: 3,
                    purchase: 4,
                    receipt: 5
                },
                exactcare: {
                    trip: 1,
                    coverage: 2,
                    finish: 3,
                    purchase: 4,
                }
            },
            date: {
                format: 'MM/dd/yyyy',
                displayFormat: dateDisplayFormat,
                urlFormat: 'MM-DD-YYYY',
                dataFormat: 'MM/DD/YYYY'
            },
            lookups: {
                genders: [
                    { name: 'Select', code: null },
                    { name: 'Male', code: 'male' },
                    { name: 'Female', code: 'female' }
                ]
            },
            masks: {
                date: "99/99/9999",
                age: { mask: '9', repeat: 3, greedy: false },
                phone: "(999) 999-9999",
                postalCode: "99999",
                costCurrency: { radixPoint: ".", groupSeparator: ",", digits: 0, autoGroup: true, repeat: 8, greedy: false }
            },
            travelers: {
                maxTravelers: maximumTravelers,
            },
            errors: {
                traveler: {
                    birthdate: {
                        req: "Date of birth is required.",
                        format: "Date of birth must be a valid date in " + dateDisplayFormat + " format.",
                        min: "Date of birth must be greater than 1/1/1900.",
                        max: "Date of birth cannot be in the future.",
                        over18: "Primary traveler must be at least 18 years old."
                    },
                    firstName: { req: "First Name is required." },
                    lastName: { req: "Last Name is required." },
                    gender: { req: "Gender is required." },
                    address1: { req: "Address 1 is required." },
                    address2: { req: "Address 2 is required." },
                    city: { req: "City is required.", length: "Max length of City cannot be over 40 characters" },
                    postalCode: {
                        req: "Postal code is required.",
                        valid: "Please enter a valid Postal Code."
                    },
                    state: { req: "State is required." },
                    relationship: { req: "Relationship to the primary traveler is required." },
                    email: {
                        req: "Email address is required.",
                        format: "Please enter a valid email address.",
                        opt: "Please provide an email address or check No Email Address."
                    },
                    phone: {
                        req: "Phone number is required.",
                        format: "Please enter a valid phone number."
                    },
                    maxTravelers: {
                        maxNumberMessage: '*Number of covered travelers may not exceed ' + (maximumTravelers + 1),
                    },
                },
                flight: {
                    date: {
                        req: "Flight date is required.",
                        valid: "Flight date must be a valid date and must occur in the future."
                    },
                    notFound: "Flight not found, please check data.",
                    airline: { req: "Airline is required." },
                    number: {
                        req: "Valid flight number is required.",
                        format: "Flight number must be numerical."
                    }
                },
                trip: {
                    departure: {
                        req: "Departure date is required.",
                        min: "Departure date must be valid date in future.",
                        max: "Departure date must be before the return date.",
                        format: "Departure date must be a valid date in " + dateDisplayFormat + " format."
                    },
                    returnDate: {
                        req: "Return date is required.",
                        min: "Return date must be on or after departure date.",
                        triplength: "Trip can not exceed 180 days.",
                        format: "Return date must be a valid date in " + dateDisplayFormat + " format."
                    },
                    country: { req: "Destination country is required." },
                    state: { req: "Destination state is required." },
                    city: { req: "Destination city is required.", length: "Max length of Destination City cannot be over 40 characters" },
                    cost: {
                        req: "Trip cost is required.",
                        min: "Trip Cost cannot be less than $0.",
                        max: "Trip cost should be less than 100,000 per traveler."
                    },
                    depositDate: {
                        req: "Deposit Date is required.",
                        min: "Deposit Date must be valid date in past.",
                        format: "Deposit Date must be a valid date in " + dateDisplayFormat + " format.",
                        mindate: "Deposit Date must be greater than 1/1/1900."
                    }
                },
                provider: {
                    airline: { req: "Airline is required." },
                    hotel: { req: "Hotel is required." },
                    carRental: {
                        req: "Car rental company is required.",
                        pickup: {
                            req: "Pickup date is required.",
                            min: "Car pickup date must be on or after trip departure date.",
                            max: "Pickup date must be on or before car return date.",
                            format: "Pickup date must be a valid date in " + dateDisplayFormat + " format."
                        },
                        returnDate: {
                            req: "Return date is required.",
                            min: "Car return date must be on or after car pickup date.",
                            max: "Car return date must be on or before trip return date.",
                            format: "Car return date must be a valid date in " + dateDisplayFormat + " format."
                        }
                    },
                    cruiseLine: { req: "Cruise line is required." },
                    otherRental: { req: "Rental company is required." },
                    tourOperator: { req: "Tour operator is required." }
                },
                purchase: {
                    address: {
                        street: { req: "Address is required." },
                        city: { req: "City is required.", length: "Max length of City cannot be over 40 characters" },
                        postalCode: {
                            req: "Postal code is required",
                            format: "Please enter a valid Postal Code."
                        }
                    }
                }
            }
        });

        jwtInterceptorProvider.tokenGetter = function () {
            return localStorage.getItem('idToken');
        }

        $httpProvider.interceptors.push('jwtInterceptor');

        $httpProvider.interceptors.push([
            '$q', function ($q) {
                return {
                    'request': function (config) {
                        return config;
                    },

                    'requestError': function (rejection) {
                        return $q.reject(rejection);
                    },

                    'responseError': function (rejection) {
                        return $q.reject(rejection);
                    }
                };
            }
        ]);
    }

    angular.module('agentPortal').run([
            '$rootScope', 'googletagmanager', '$http', 'authenticationNavigationService', function ($rootScope, googletagmanager, $httpProvider, authenticationNavigationService) {

            $rootScope.$on('$stateChangeStart', authenticationNavigationService.onStateChangeHandleBack);
            $rootScope.$on('$stateChangeSuccess', authenticationNavigationService.onStateChangeSuccess);
            $rootScope.$on('$stateChangeStart', authenticationNavigationService.onStateChangeNavigation);

            // Set request headers
            $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            /* Set headers based on isCustomSession from localstorage, isCustomSession means the agent came from
               a post request on the Home controller
            */
            if (window.sessionStorage.customSession) {
                $httpProvider.defaults.headers.common['BHTPOrigin'] = 'clientbase';
                $httpProvider.defaults.headers.common['X-Bhtp-Origin'] = 'clientbase';
            }
            else {
                $httpProvider.defaults.headers.common['BHTPOrigin'] = 'agents.bhtp.com';
                $httpProvider.defaults.headers.common['X-Bhtp-Origin'] = 'agent';
            }
        }
    ]);
})();
