(function () {
    'use strict';

    /**
     * @ngdoc factory
     * @name customersService
     *
     * # customersService
     *
     * @description
     * service to support backend integration for customers page
     */
    angular.module('agentPortal')
        .factory('customersService', ['$rootScope', '$resource', '$q', 'portalService', 'utilService', '$state', customersService]);

    var queryCustomersUrl = '/APIProxy/agents/:agentId/customers?limit=-1&status=all';
    var getCustomerByIdUrl = '/APIProxy/agents/:agentId/customer/:customerId';
    var queryCustomersPagedUrl = '/APIProxy/agency/:agencyId/customers?limit=:pageSize&status=all&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText';
    var queryCustomersSearchUrl = '/APIProxy/agency/:agencyId/CustomerSearch?limit=:pageSize&status=all&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText';
    var genderApi = '/APIProxy/Agents/Customer/:customerId/Gender/:gender';
    var getCustomerByEmailUrl = '/APIProxy/agency/:agencyId/email?email=:email';
    var updateMissingRequiredProfileUrl = '/APIProxy/Agents/Customer/:customerId';
    var productStateMetaDataUrl = '/apiproxyv2/bhtp/Eligibility/ProductStateMetadata/:packageId/:state';
    var removeCustomerUrl = '/apiproxyv2/bhtp/clients/v1/Customer/:customerId/:agentId';

    function customersService($rootScope, $resource, $q, portalService, utilService, $state) {

        return {
            getDateFilters: getDateFilters,
            loadData: loadData,
            getById: getById,
            loadPagedData: loadPagedData,
            updateGender: updateGender,
            getByEmail: getByEmail,
            updateTravelerDetails: updateTravelerDetails,
            loadCustomerDetail: loadCustomerDetail,
            removeCustomer : removeCustomer
        };

        function updateGender(customerId, gender) {
            //return Gender.update({ customerId: customerId, gender: gender });
            var genderUpdate = $resource(genderApi, { customerId: customerId, gender: gender }, { update: { method: 'PUT' } });
            return genderUpdate.update();
        }


        /**
         * @description
         * loads customers from the server
         */
        function loadData() {
            return portalService.getAgentByInternalId().then(function (agent) {
                var customersApi = $resource(queryCustomersUrl, { agentId: agent.agentId });
                return customersApi.query().$promise;
            });
        }

        /**
         * @description
         * loads single customer by given id, to show customer details page
         */
        function getById(customerId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(getCustomerByIdUrl, { agentId: agent.agentId, customerId: customerId }).get().$promise;
            });
        }

        /*
       * @desription
       * Calls the BHTP Client Api to remove a customer from a partners view
       */
        function removeCustomer(customerId, redirectTo, firstName, lastName, refreshFunction) {
            return portalService.getAgentByInternalId().then(function (agent) {

                var removeMessage = 'Removing a customer removes that customer and any of their unpurchased quotes. Are you sure you want to remove ' + firstName + ' ' + lastName + '?';
                var removeTitle = 'Remove Customer Validation';
                var buttons = [
                    {
                        style: "btn btn-lg btn-default btn-cust-sec",
                        action: function (f) {
                            // Nothing Happens
                            return false;
                        },
                        name: "No"
                    },
                    {
                        style: "btn btn-lg btn-default btn-cust",
                        action: function (f) {
                            $resource(removeCustomerUrl, { agentId: agent.agentId, customerId: customerId }).delete().$promise.then(function (result) {
                                // Display Success Message
                                utilService.showMessagePopup('Message', 'The customer has been removed.');

                                if (refreshFunction != null)
                                {
                                    refreshFunction();
                                }

                                // Redirect to the Customer List
                                if (redirectTo != null)
                                {
                                    $state.go(redirectTo);
                                }
                                
                                return true;
                            },
                             function (error) {
                                 // Display Error Message
                                 utilService.showMessagePopup('Message', 'Somthing went wrong while removing the customer.', 'fa fa-exclamation-circle fa-icon-medium fa-icon-error');
                                 return false;
                             });
                        },
                        name: "Yes"
                    }
                ];

                utilService.showConfirmWithOptionsPopupNoMessages(removeTitle, removeMessage, buttons);
            });
        }

        /**
         * @description
         * loads single customer by given id, to show customer details page
         */
        function getByEmail(email) {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(getCustomerByEmailUrl, { agencyId: agent.agencyId, email: encodeURIComponent(email) }).get().$promise;
            });
        }

        /**
         * @description
         * date filters for customers grid 
         */
        function getDateFilters() {
            return [
                { interval: 'All', name: 'All' },
                { interval: '0', name: 'Today' },
                { interval: '1', name: 'This Week' },
                { interval: '2', name: 'This Month' },
                { interval: '3', name: 'Past Month' },
                { interval: '4', name: 'YTD' }
            ];
        }

        /**
         * @description
         * loads customers from the server
         */
        function loadPagedData(agentId, packageId, pageNumber, orderBy, direction, dateSelected, searchText) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var customersApi = $resource(queryCustomersPagedUrl, {
                    agencyId: agent.agencyId,
                    agentId: agentId,
                    packageId: packageId,
                    pageNumber: pageNumber,
                    orderBy: orderBy,
                    direction: direction,
                    startDate: dateSelected.startDate,
                    endDate: dateSelected.endDate,
                    pageSize: $rootScope.config.CLIENT_GRID_PAGE_SIZE,
                    customerId: "",
                    searchText: searchText
                }, { get: { method: 'GET', isArray: false } });
                //return customersApi.query().get.$promise;
                return customersApi.get().$promise;
            });
        }

        /**
       * @description
       * loads customers from the server
       */
        function loadCustomerDetail(agentId, searchText, packageId, pageNumber, orderBy, direction, dateSelected) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var customersApi = $resource(queryCustomersSearchUrl, {
                    agencyId: agent.agencyId,
                    agentId: agentId,
                    packageId: packageId,
                    pageNumber: 1,
                    orderBy: orderBy,
                    direction: direction,
                    startDate: dateSelected,
                    endDate: dateSelected,
                    pageSize: $rootScope.config.CLIENT_GRID_PAGE_SIZE,
                    customerId: "",
                    searchText: searchText
                }, { get: { method: 'GET', isArray: false } });
                //return customersApi.query().get.$promise;
                return customersApi.get().$promise;
            });
        }

        function updateMissingRequiredProfile(customerId, travelerDetails) {
            var travelerUpdate = $resource(updateMissingRequiredProfileUrl, null,
                {
                    'update': { method: 'PUT' }
                });

            var mappedProfile = mapForProfileUpdate(travelerDetails);

            return travelerUpdate.update({ customerId: customerId }, mappedProfile);
        }

        function mapForProfileUpdate(profile) {
            var mappedProfile = {
                firstName: profile.firstName,
                lastName: profile.lastName,
                address1: profile.address1,
                address2: profile.address2,
                city: profile.city,
                state: profile.stateOrProvince,
                zip: profile.postalCode,
                email: profile.emailAddress,
                dateOfBirth: moment(profile.birthDate).format('YYYY-MM-DD'),
                country: profile.country,
                phoneNumber: profile.phoneNumber,
                profileType: profile.profileType,
                gender: profile.gender,
                isTestProfile: profile.testProfile
            };

            return mappedProfile;

        }

        /*
         * @desription
         * verifies that primary traveler is setup properly with all required profile fields.
         */
        function updateTravelerDetails(traveler, productId, state) {
            getProductStateMetaData(productId, state).then(function (resp) {
                var primaryRules = formatProfileRulesForComparison(resp.primaryTravelerRules.required);
                compareSfUserDetails(traveler, primaryRules);
            });
        }

        function getProductStateMetaData(packageId, state) {
            var metaData = $resource(productStateMetaDataUrl, { packageId: packageId, state: state });
            return metaData.get().$promise;
        }

        /*
         * @description
         * This formats the profile rules from ProductMetaData Rules endpoint to be compared to the primary traveler
         */
        function formatProfileRulesForComparison(profileRules) {
            var fieldsRequired = [];
            for (var i = 0; i < profileRules.length; i++) {
                if (profileRules[i].isTrue) {
                    fieldsRequired.push(profileRules[i].fieldKey);
                }
            }
            return fieldsRequired;
        }

        function compareSfUserDetails(traveler, profileRules) {
            var fieldsNeeded = [];

            if (traveler.emailAddress) {
                var profile = getByEmail(traveler.emailAddress);
                profile.then(function (results) {
                    var salesForceAccount = results;
                    for (prop in salesForceAccount.address) {
                        salesForceAccount[prop] = salesForceAccount.address[prop];
                    }
                    if (salesForceAccount.phoneNumbers && salesForceAccount.phoneNumbers.length > 0) {
                        for (prop in salesForceAccount.phoneNumbers[0]) {
                            salesForceAccount[prop] = salesForceAccount.phoneNumbers[0][prop];
                        }
                    } else {
                        salesForceAccount["phoneNumber"] = null;
                    }
                    for (var i = 0; i < profileRules.length; i++) {
                        var ruleField = (mapRuleField(profileRules[i])).toLowerCase();
                        for (var prop in salesForceAccount) {
                            var tempProp = (mapRuleField(prop)).toLowerCase();
                            if (tempProp == ruleField) {
                                if (salesForceAccount[prop] == null || salesForceAccount[prop] == undefined) {
                                    fieldsNeeded.push(prop);
                                    break;
                                }
                            }
                        }
                    }
                    if (fieldsNeeded.length && fieldsNeeded.length > 0) {
                        updateUserDetails(fieldsNeeded, profileRules, salesForceAccount, traveler);
                    }
                });
            }
        }

        function mapRuleField(field) {
            var tempField = field.toLowerCase();
            switch (true) {
                case (tempField == 'birthdate'):
                    field = 'dateofbirth';
                    break;
                case (tempField == 'postalcode'):
                    field = 'zip';
                    break;
                case (tempField == 'stateorprovince'):
                    field = 'state';
                    break;
                default:
                    break;
            }

            return field;
        }

        function updateUserDetails(fieldsNeeded, profileRules, salesForceAccount, traveler) {
            for (var addressProp in traveler.address) {
                traveler[addressProp] = traveler.address[addressProp];
            }

            for (var i = 0; i < fieldsNeeded.length; i++) {
                var ruleField = (mapRuleField(fieldsNeeded[i])).toLowerCase();
                for (var prop in traveler) {
                    var tempProp = (mapRuleField(prop)).toLowerCase();
                    if (tempProp == ruleField) {
                        salesForceAccount[fieldsNeeded[i]] = traveler[prop];
                        break;
                    }
                }
            }
            updateMissingRequiredProfile(salesForceAccount.customerId, salesForceAccount);
        }
    }
})();