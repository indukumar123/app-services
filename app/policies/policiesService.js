(function () {
    'use strict';
    /**
     * @ngdoc factory
     * @name policiesService
     *
     * # policiesService
     *
     * @description
     * backend API integration for policies page
     */
    angular.module('agentPortal')
        .factory('policiesService', ['$rootScope', 'portalService', '$resource', '$q', 'customersService', 'lookupDataService', 'settings', 'utilService', '$modal', 'paymentMethods', policiesService]);

    var queryPoliciesUrl = '/APIProxy/agents/:agentId/policies?limit=-1&startDate=:startDate&endDate=:endDate&status=:status&productId=a0r11000000QslE&dateContext=Purchase';
    var policyByIdUrl = '/APIProxy/agents/:agentId/policies/:policyNumber';
    var cancelPolicyByIdUrl = '/APIProxy/agents/:agentId/policy/:policyNumber/cancel';
    var policyResendByIdUrl = '/APIProxy/agents/:agentId/policy/:policyId/resend';

    var customerPoliciesUrl = '/APIProxy/agents/:agentId/customer/:customerId/policies';
    var queryPoliciesPagedUrl = '/APIProxy/agency/:agencyId/policies?limit=:pageSize&status=:status&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText&submissionChannel=:submissionChannel';
    var queryCustomerPoliciesPagedUrl = '/APIProxy/agency/:agencyId/customer/:customerId/policies?limit=:pageSize&status=:status&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText&submissionChannel=:submissionChannel';

    function policiesService($rootScope, portalService, $resource, $q, customersService, lookupDataService, settings, utilService, $modal, paymentMethods) {
        return {
            getDateFilters: getDateFilters,
            getStatusList: getStatusList,
            loadData: loadData,
            getById: getById,
            getForCustomer: getForCustomer,
            getFullById: getFullById,
            setPolicyActions: setPolicyActions,
            cancelPolicy: cancelPolicy,
            confirmCancelPolicy: confirmCancelPolicy,
            resendPolicyDocs: resendPolicyDocs,
            loadPagedData: loadPagedData,
            getProductsGoupedByName: getProductsGoupedByName,
            loadAgencyProductsAndPackages:loadAgencyProductsAndPackages
        };

        /**
         * @description
         * loads policy information by given policy number
         */
        function getById(policyNumber) {
            var deferredPromise = $q.defer();

            portalService.getAgentByInternalId().then(function (agent) {
                $resource(policyByIdUrl, { agentId: agent.agentId, policyNumber: policyNumber }).get().$promise.then(function (results) {
                    if (results.policy == undefined) {
                        return deferredPromise.reject(results);
                    }

                    utilService.sendPrimaryTravelerToZeroIndex(results.policy.travelers);

                    deferredPromise.resolve(results);
                }, function (error) {
                    deferredPromise.reject(error);
                });
            });

            return deferredPromise.promise;
        }

        /**
         * @description
         * retrieves policy and its lookup data for given policy number
         */
        function getFullById(policyNumber) {
            return getById(policyNumber)
                .then(loadPolicyData);
        }

        /**
         * @description
         * retrieves supporting information (i.e., for lookups, etc) for the loaded policy
         */
        function loadPolicyData(response) {
            if (!response.policy)
                return $q.reject('There was an error loading policy');

            var deferredPromise = $q.defer();
            var fullPolicy = { policy: response, customer: null, travel: {}, destination: {} };
            $q.all([
                customersService.getById(response.policy.primaryTraveler),
                lookupDataService.getCountryByCode(response.policy.destinationCountry).then(function (country) {
                    fullPolicy.destination.country = country;
                })
            ]).then(function (responses) {
                fullPolicy.customer = responses[0];
                deferredPromise.resolve(fullPolicy);
            });
            return deferredPromise.promise;
        }

        /**
         * @description
         * loads policies from the server by given status
         */
        function loadData(policyStatus) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var quotesApi = $resource(queryPoliciesUrl, { agentId: agent.agentId });

                var now = moment();

                var startDate = moment("1900-01-01", "YYYY-MM-DD").format(settings.date.urlFormat);
                var endDate = now.add(1, 'days').format(settings.date.urlFormat);

                if (!policyStatus)
                    policyStatus = 'All';

                return quotesApi.query({ status: policyStatus, startDate: startDate, endDate: endDate }).$promise;
            });
        }

        /**
         * @description
         * loads policy information by given customer id
         */
        function getForCustomer(customerId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(customerPoliciesUrl, { agentId: agent.agentId, customerId: customerId }).query().$promise;
            });
        }
        /**
         * @description
         * returns various time-ranges for date related filtering
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
         * returns filtering for products - currently hardcoded gives value of package name
         */
        function getProductsGoupedByName() {
            return portalService.loadProductsAndPackages().then(function (response) {
                var respPackages = response.packages;
                var packages = [];
                packages.push({ value: '', name: 'All Products' });
                for (var i = 0; i < respPackages.length; i++) {
                    var label = respPackages[i].name;
                    if (respPackages[i].subTitle) {
                        label += " " + respPackages[i].subTitle;
                    }

                    var alreadyContains = false;
                    for (var p = 0; p < packages.length; p++) {
                        if (packages[p].name == label) {
                            alreadyContains = true;
                            packages[p].value = packages[p].value + "," + respPackages[i].id;
                            break;
                        }
                    }

                    if (alreadyContains == false) {
                        packages.push({ value: respPackages[i].id, name: label });
                    }
                }
                return packages;
            });
        }

        /**
         * @description
         * returns filtering for agency products and expired packages- currently hardcoded gives value of package name
         */
        function loadAgencyProductsAndPackages(agencyId) {
            return portalService.loadAgencyProductsAndPackages(agencyId).then(function (response) {
                var respPackages = response.packages;
                var packages = [];
                packages.push({ value: '', name: 'All Products' });
                for (var i = 0; i < respPackages.length; i++) {
                    var label = respPackages[i].name;
                    if (respPackages[i].subTitle) {
                        label += " " + respPackages[i].subTitle;
                    }
                    var alreadyContains = false;
                    for (var p = 0; p < packages.length; p++) {
                        if (packages[p].name == label) {
                            alreadyContains = true;
                            packages[p].value = packages[p].value + "," + respPackages[i].id;
                            packages[p].id = packages[p].id + "," + respPackages[i].id;
                            packages[p].ratingId = packages[p].ratingId + "," + respPackages[i].ratingId;
                            packages[p].subTitle = packages[p].subTitle + "," + respPackages[i].subTitle;
                            break;
                        }
                    }

                    if (alreadyContains == false) {
                        packages.push({
                            value: respPackages[i].id,
                            id: respPackages[i].id,
                            name: label,
                            ratingId: respPackages[i].ratingId,
                            subTitle: respPackages[i].subTitle
                        });
                    }
                }
                return packages;
            });
        }

        /**
         * @description
         * loads filters for status list - currently hardcoded
         */
        function getStatusList() {
            return [
                { value: '', name: 'All' },
                { value: 'Active', name: 'Active' },
                { value: 'Effective', name: 'Effective' },
                { value: 'Expired', name: 'Expired' },
                { value: 'Cancelled', name: 'Cancelled' }
            ];
        }
        /**
         * @description
         * Sets the policy actions for an item in a grid
         */
        function setPolicyActions(policy, cancelFunction, isAmbassador) {
            policy.actions = [];

            //An ambassador cannot edit or cancel policy if payment method is 'invoice' or 'prepaid'
            //All other users can do that but not if the payment methhod is 'prepaid'

            if (policy.paymentMethod && (policy.paymentMethod.toLowerCase() === paymentMethods.prepaid || policy.paymentMethod.toLowerCase() === paymentMethods.invoice)) {
                if (isAmbassador || (policy.paymentMethod.toLowerCase() === paymentMethods.prepaid && !isAmbassador)) {
                policy.canBeCancelled = false;
                policy.canBeEdited = false;
                }
            }

            if (policy.fulfillmentMethod === "Email") {
                policy.actions.push({ label: "Resend", icon: "glyphicon-share-alt", href: '#', click: resendPolicyDocs });
            }
            // For now, only add if action is allowed.
            if (policy.canBeEdited === true) {
                policy.actions.push({ label: "Edit", icon: "glyphicon-edit", href: 'policies/edit/' + policy.policyNumber, disabled: policy.canBeEdited != true });
            }

            if (policy.canBeCancelled === true) {
                policy.actions.push({ label: "Cancel", click: cancelFunction, icon: "glyphicon-remove", href: '#', disabled: policy.canBeCancelled != true });
            }
        }
        /**
         * @description
         * cancels policy by id as long as agent has authorization to do so
         */
        function cancelPolicy(policyNumber) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var cancelApi = $resource(cancelPolicyByIdUrl, { agentId: agent.agentId, policyNumber: policyNumber }, { cancelPolicy: { method: 'POST' } });
                return cancelApi.cancelPolicy(null).$promise;
            });
        }

        function confirmCancelPolicy(policyDetails, success) {
            var modalInstance = $modal.open({
                templateUrl: 'app/policies/cancelModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.vm = policyDetails;

                    $scope.vm.getCancelText = function () {
                        var text = "";
                        if ($scope.vm.canBeRefunded == true) { // && $scope.vm.cancelRequiresWrittenNotice == false
                            text = text = "Are you sure you wish to cancel your policy?";
                        }
                        /*
                        else if ($scope.vm.canBeRefunded == true && $scope.vm.cancelRequiresWrittenNotice == true) {
                            text = "As your cancellation request falls outside of the policy free-look period, we are unable to provide you with a refund without a written request. Are you sure you wish to cancel your policy?";
                        }
                        */
                        else if ($scope.vm.canBeRefunded == false) {
                            text = "As your cancellation request falls within " + $scope.vm.preDepartureNoticeRefundDays + " days of your scheduled departure date, we are unable to provide you with a refund. Are you sure you wish to cancel your policy?";
                        }
                        return text;
                    };
                    $scope.vm.cancelText = $scope.vm.getCancelText();

                    $scope.ok = function () {
                        cancelPolicy(policyDetails.policyNumber).then(
                            success,
                            function (error) {
                                if (error != null) {
                                    utilService.showPopup("Error", "An error occurred during Cancel Policy");
                                }
                            }
                        );
                        $modalInstance.dismiss('close');
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }]
            });
        };
    
        function resendPolicy(policyId, email) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var resendApi = $resource(policyResendByIdUrl, { agentId: agent.agentId, policyId: policyId }, { resend: { method: 'POST' } });
                return resendApi.resend(email).$promise;
            });
        }

        function resendPolicyDocs(policyDetails) {
            // policyDetails is an 'action' in the case of a cog, or a policy in the case of the details page
            var policyId = (policyDetails.policyId) ? policyDetails.policyId : policyDetails.id;
            var email = ""; //get user email here

            //resendPolicy(policyNumber, '"' + email + '"').then(function (response) {
            resendPolicy(policyId).then(function (response) {
                utilService.showMessagePopup("Resend Policy", "Your policy documents have been sent. They should arrive in your email shortly.");
            }, function (error) {
                utilService.showPopup("Resend Policy", "There was a problem sending email. Please try again later.");
            });

        };

        /**
         * @description
         * retrieves quotes for given agent (i.e., logged in user)
         */
        function loadPagedData(agentId, packageId, pageNumber, orderBy, direction, dateSelected, customerId, searchText, status, submissionChannel) {
            var now = moment();

            var startDate = moment("1900-01-01", "YYYY-MM-DD").format(settings.date.urlFormat);
            var endDate = now.add(1, 'days').format(settings.date.urlFormat);
            if (!status) {
                status = "all";
            }

            return portalService.getAgentByInternalId().then(function (agent) {
                if (customerId) {
                    var quotesApi = $resource(queryCustomerPoliciesPagedUrl, {
                        agencyId: agent.agencyId,
                        agentId: agentId,
                        packageId: packageId,
                        pageNumber: pageNumber,
                        orderBy: orderBy,
                        direction: direction,
                        startDate: dateSelected.startDate,
                        endDate: dateSelected.endDate,
                        pageSize: $rootScope.config.CLIENT_GRID_PAGE_SIZE,
                        customerId: customerId,
                        searchText: searchText,
                        status: status,
                        submissionChannel: submissionChannel
                    }, { get: { method: 'GET', isArray: false } });


                    return quotesApi.get().$promise;
                }
                else {
                    var quotesApi = $resource(queryPoliciesPagedUrl, {
                        agencyId: agent.agencyId,
                        agentId: agentId,
                        packageId: packageId,
                        pageNumber: pageNumber,
                        orderBy: orderBy,
                        direction: direction,
                        startDate: dateSelected.startDate,
                        endDate: dateSelected.endDate,
                        pageSize: $rootScope.config.CLIENT_GRID_PAGE_SIZE,
                        customerId: customerId,
                        searchText: searchText,
                        status: status,
                        submissionChannel: submissionChannel
                    }, { get: { method: 'GET', isArray: false } });


                    return quotesApi.get().$promise;
                }
            });            
        }

       
    }
})();