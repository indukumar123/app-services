(function () {
    'use strict';

    /**
     * @ngdoc factory
     * @name quotesService
     *
     * # quotesService
     *
     * @description
     * backend API integration for quotes related requirements
     */

    angular.module('agentPortal')
        .factory('quotesService', quotesService);

    quotesService.$inject = ['$rootScope', '$resource', '$q', '$state', 'settings', 'customersService', 'lookupDataService', 'utilService', '$modal', '$sessionStorage', 'portalService'];

    var queryQuotesUrl = '/APIProxy/agents/:agentId/quotes?limit=-1&startDate=:startDate&endDate=:endDate&dateContext=purchase';

    // agents/Quotes
    var quoteByIdUrl = '/APIProxy/agents/:agentId/quotes/:quoteId';
    var deleteQuotesUrl = '/APIProxy/agents/:agentId/deletequotes';
    var emailQuotesUrl = '/APIProxy/agents/:agentId/emailquote/:quoteId';
    var emailEncryptedQuotesUrl = '/APIProxy/agents/:agentId/emailencryptedquote/:quoteId';
    var quotesByCustomer = '/APIProxy/agents/:agentId/customer/:customerId/Quotes';
    var queryQuotesPagedUrl = '/APIProxy/agency/:agencyId/quotes?limit=:pageSize&status=all&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText';
    var queryCustomerQuotesPagedUrl = '/APIProxy/agency/:agencyId/customer/:customerId/quotes?limit=:pageSize&status=all&packageId=:packageId&agentId=:agentId&pageNumber=:pageNumber&orderBy=:orderBy&direction=:direction&startDate=:startDate&endDate=:endDate&pageSize=:pageSize&customerId=:customerId&dateContext=Purchase&searchText=:searchText';
    var rewardQuotesListUrl = '/APIProxyV2/BHTP/v1/Agents/Quotes/Rewards/:agentCode';
    var rewardQuoteUrl = '/APIProxyV2/BHTP/v1/Agents/Quotes/Rewards/:agentCode/:quoteNumber';
    var confirmRewardQuoteUrl = '/APIProxyV2/BHTP/v1/Agents/Quotes/ConfirmRewards/:agentCode';
    var denyRewardQuoteUrl = '/APIProxyV2/BHTP/v1/Agents/Quotes/DenyRewards/:agentCode';
    var quoteByNumberUrl = '/APIProxy/quotes/:quoteNumber/number/agents/:agentId';
    var quickQuoteEmailUrl = '/APIProxyV2/BHTP/clients/v1/Agents/EmailQuickQuote';

    function quotesService($rootScope, $resource, $q, $state, settings, customersService, lookupDataService, utilService, $modal, $sessionStorage, portalService) {
        return {
            getDateFilters: getDateFilters,
            getProducts: getProducts,
            removeQuotes: deleteQuotes,
            emailQuote: emailQuote,
            loadData: loadData,
            getById: getById,
            getForCustomer: getForCustomer,
            getFullById: getFullById,
            getLicenseMessage: showLicenseMessage,
            loadPagedData: loadPagedData,
            getProductsGoupedByName: getProductsGoupedByName,
            getRewardQuotes: getRewardQuotes,
            confirmRewardPoints: confirmRewardPoints,
            cancelRewardPoints: cancelRewardPoints,
            getRewardQuote: getRewardQuote,
            confirmRewardPointsQuotes: confirmRewardPointsQuotes,
            getInProcessRewardQuotes: getInProcessRewardQuotes,
            setInProcessRewardQuotes: setInProcessRewardQuotes,
            denyRewardPointsQuotes: denyRewardPointsQuotes,
            loadAgencyProductsAndPackages: loadAgencyProductsAndPackages,
            getByNumber: getByNumber,
            emailQuickQuote: emailQuickQuote
        };

        /**
         * @description
         * retrieves quote by given quote Id, returns in form of promise
         */
        function getById(quoteId) {
            var deferredPromise = $q.defer();
            
            portalService.getAgentByInternalId().then(function (agent) {
                $resource(quoteByIdUrl, { agentId: agent.agentId, quoteId: quoteId }).get().$promise.then(function (results) {
                    if (results.policy == undefined) {
                        deferredPromise.reject(results);
                    }
                    else {
                        deferredPromise.resolve(results);
                    }
                });
            });

            return deferredPromise.promise;
        }


        /**
         * @description
         * retrieves 'filled' quote (not  a promise) for given quoteId
         */
        function getFullById(quoteId) {
            return getById(quoteId)
                .then(loadQuoteData);
        }

        /**
         * @description
         * retrieves supporting information (i.e., for lookups, etc) for the loaded quote
         */
        function loadQuoteData(quote) {
            if ( !quote.policy ) {
                return $q.reject('There was an error loading quote');
            }

            var deferredPromise = $q.defer();
            var fullQuote = { quote: quote, customer: null, travel: {}, destination: {} };
            var lookupUrl = lookupDataService.lookupDataUrl();

            $q.all([
                    customersService.getById(quote.policy.primaryTraveler),
                    lookupDataService.getProviderInfo(lookupUrl.airline, quote.policy.airline),
                    lookupDataService.getProviderInfo(lookupUrl.tourOperator, quote.policy.tourOperator),
                    lookupDataService.getProviderInfo(lookupUrl.cruiseLine, quote.policy.cruiseLine),
                    lookupDataService.getProviderInfo(lookupUrl.hotel, quote.policy.hotel),
                    lookupDataService.getProviderInfo(lookupUrl.carRentalCompany, quote.policy.carRentalCompany),
                    lookupDataService.getProviderInfo(lookupUrl.rentalCompany, quote.policy.rentalCompany),
                    lookupDataService.getCountryByCode(quote.policy.destinationCountry).then(function (country) {
                        fullQuote.destination.country = country;
                    })
            ]).then(function (responses) {
                fullQuote.customer = responses[0];
                fullQuote.travel.airline = getProviderObject(responses[1], quote.policy.airline);
                fullQuote.travel.tourOperator = getProviderObject(responses[2], quote.policy.tourOperator);
                fullQuote.travel.cruiseLine = getProviderObject(responses[3], quote.policy.cruiseLine);
                fullQuote.travel.hotel = getProviderObject(responses[4], quote.policy.hotel);
                fullQuote.travel.carRentalCompany = getProviderObject(responses[5], quote.policy.carRentalCompany);
                fullQuote.travel.rentalCompany = getProviderObject(responses[6], quote.policy.rentalCompany);
                deferredPromise.resolve(fullQuote);
            });
            return deferredPromise.promise;
        }

        /**
         * @description
         * looks up provider information by given provider's text
         */

        function getProviderObject(response, providerText) {
            if (!response || response.length != 1 || providerText !== response[0].name) {
                return {
                    id: null,
                    name: providerText
                };
            }
            var providerObject = response[0];
            providerObject.id = providerObject.salesForceId;
            return providerObject;
        }

        /**
         * @description
         * retrieves quotes for given agent (i.e., logged in user)
         */
        function loadData() {
            return portalService.getAgentByInternalId().then(function (agent) {
                var quotesApi = $resource(queryQuotesUrl, { agentId: agent.agentId });
                var now = moment();

                var startDate = moment("1900-01-01", "YYYY-MM-DD").format(settings.date.urlFormat);
                var endDate = now.add(1, 'days').format(settings.date.urlFormat);

                return quotesApi.query({ startDate: startDate, endDate: endDate }).$promise;
            });
        }

        /**
         * @description
         * deletes selected quotes indicated by given quoteIds 
         */
        function deleteQuotes(quoteIds) {
            return portalService.getAgentByInternalId().then(function (agent) {
                var deleteQuotesApi = $resource(deleteQuotesUrl, { agentId: agent.agentId },
                                                { deleteQuotes: { method: 'POST' } });
                return deleteQuotesApi.deleteQuotes(quoteIds).$promise;
            });
        }

        /**
         * @description
         * sends quote details via email 
         */
        function emailQuote(quoteId, emailIds, quoteComment) {
            return portalService.getAgentByInternalId()
                .then(function (agent) {
                    var url = emailQuotesUrl;

                    if (global_enable_encryptedquote) {
                        url = emailEncryptedQuotesUrl;
                    }

                    var emailQuotesApi = $resource(
                        url,
                        {
                            agentId: agent.agentId,
                            quoteId: quoteId,
                            quoteComment: quoteComment
                        },
                        {
                            email: { method: 'POST' }
                        });

                    return emailQuotesApi.email(emailIds).$promise;
                });
        }

        /**
         * @description
         * get quotes for given customer (represented by customerId)
         */
        function getForCustomer(customerId) {
            return portalService.getAgentByInternalId().then(function (agent) {
                return $resource(quotesByCustomer, { agentId: agent.agentId, customerId: customerId }).query().$promise;
            });
        }
        
        /**
         * @description
         * grid implementation - date filters 
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
         * grid implementation - products for filtering - hard-coded
         */
        function getProducts() {
            return portalService.loadProductsAndPackages().then(function (response) {
                var respPackages = response.packages;
                var packages = [];
                packages.push({ value: '', name: 'All Products' });
                for (var i = 0; i < respPackages.length; i++) {
                    var label = respPackages[i].name;
                    if (respPackages[i].subTitle) {
                        label += " " + respPackages[i].subTitle;
                    }
                    packages.push({
                        value: respPackages[i].id,
                        id: respPackages[i].id,
                        name: label,
                        ratingId: respPackages[i].ratingId,
                        subTitle: respPackages[i].subTitle
                    });
                }
                return packages;
            });
        }

        /**
         * @description
         * grid implementation - products for filtering - hard-coded
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
         * returns filtering for agency products and expired packages- currently hardcoded gives value of package name
         */
        function loadAgencyProductsAndPackages(agencyId)
        {
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
     * Show Licenses message 
     */
    function showLicenseMessage(stateCode) {
        getCurrentResidenceName(stateCode).then(function(residenceName){
            var buttons = [];
            buttons.push({
                style: "btn btn-lg btn-default btn-cust-sec",
                name: "Abandon Sale",
                action: function () {
                    $state.go('dashboard');
                }
            });
            buttons.push({
                style: "btn btn-lg btn-default btn-cust",
                name: "Proceed"
            });
            utilService.showConfirmWithOptionsPopup("License Validation",
                    "Your Agency does not have the required license(s) necessary to receive commission for residents of " + residenceName + '.',
                    "A license is required to sell, solicit, or negotiate with regard to insurance. Your activities must fall outside of this scope if you choose to proceed. Please contact BHTP or the insurance commissioner's office in the applicable state if you are unsure if your activities require a license.",
                    buttons);
        });
    }
    /**
     * @description
     * Gets the current state or province name 
     */
    function getCurrentResidenceName(currStateOrProvince) {
        return portalService.getAgentByInternalId().then(function (agent) {
            return portalService.loadStatesForAgent(agent.agentId).then(function (response) {
                return $.grep(response.states, function (option) {
                    return option.code == currStateOrProvince;
                })[0].name;
            })
        });
    }

    /**
     * @description
     * retrieves quotes for given agent (i.e., logged in user)
     */
    function loadPagedData(agentId, packageId, pageNumber, orderBy, direction, dateSelected, customerId, searchText) {

        return portalService.getAgentByInternalId().then(function (agent) {
            var now = moment();

            var startDate = moment("1900-01-01", "YYYY-MM-DD").format(settings.date.urlFormat);
            var endDate = now.add(1, 'days').format(settings.date.urlFormat);
            if (customerId) {
                var quotesApi = $resource(queryCustomerQuotesPagedUrl, {
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
                    searchText: searchText
                }, { get: { method: 'GET', isArray: false } });


                return quotesApi.get().$promise;
            }
            else {
                var quotesApi = $resource(queryQuotesPagedUrl, {
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
                    searchText: searchText
                }, { get: { method: 'GET', isArray: false } });


                return quotesApi.get().$promise;
            }
        });
    }

    /*
        Get reward point quotes to verify for the current agent
    */
    function getRewardQuotes() {
        return portalService.getAgentByInternalId().then(function (agent) {
            return $resource(rewardQuotesListUrl, { agentCode: agent.agentCode }, { get: { isArray: true } }).get().$promise
                .then(function (quotes) {
                    if (quotes) {
                        var quotesToReturn = [];
                        var inProcess = getInProcessRewardQuotes();
                        for (var i = 0; i < quotes.length; i++) {
                            if (!inProcess[quotes[i].quoteNumber]) {
                                quotesToReturn.push(quotes[i]);
                            }
                        }

                        return quotesToReturn;
                    }
                });
        });
    }

    function getRewardQuote(quoteNumber) {
        return portalService.getAgentByInternalId().then(function (agent) {
            return $resource(rewardQuoteUrl, { agentCode: agent.agentCode, quoteNumber: quoteNumber }).get().$promise;
        });
    }

    function confirmRewardPoints(quotes) {
        return showRewardPointsModal(quotes, true);
    }

    function cancelRewardPoints(quotes) {
        return showRewardPointsModal(quotes, false);
    }

    function confirmRewardPointsQuotes(quoteIds) {
        return portalService.getAgentByInternalId().then(function (agent) {
            var confirmRewardQuotesApi = $resource(confirmRewardQuoteUrl, { agentCode: agent.agentCode },
                                            { confirmQuotes: { method: 'POST', isArray: true } });
            return confirmRewardQuotesApi.confirmQuotes(quoteIds).$promise;
        });
    }

    function denyRewardPointsQuotes(quoteIds) {
        return portalService.getAgentByInternalId().then(function (agent) {
            var denyRewardQuotesApi = $resource(denyRewardQuoteUrl, { agentCode: agent.agentCode },
                                            { denyQuotes: { method: 'POST', isArray: true } });
            return denyRewardQuotesApi.denyQuotes(quoteIds).$promise;
        });
    }

    function setInProcessRewardQuotes(quoteIds) {
        var currentIds = $sessionStorage.processingQuoteIds;
        if (!currentIds) {
            currentIds = { };
        }

        for (var i = 0; i < quoteIds.length; i++) {
            currentIds[quoteIds[i]] = true;
        }

        $sessionStorage.processingQuoteIds = currentIds;
    }

    function getInProcessRewardQuotes() {
        if ($sessionStorage.processingQuoteIds) {
            return $sessionStorage.processingQuoteIds;
        }

        return {};
    }

    function showRewardPointsModal(quotes, confirm) {
        return $modal.open({
            templateUrl: 'app/admin/quotes/rewardQuotesDecisionModal.html',
            backdrop: true,
            windowClass: 'modal',
            controller: 'rewardQuotesDecisionController',
            controllerAs: 'vm',
            resolve: {
                quotesIds: function () {
                    return quotes;
                },
                confirm: function() {
                    return confirm;
                }
            }
        });
    }

    /**
    * @description
    * retrieves quote by given quote Number, returns in form of promise
    */
    function getByNumber(quoteNumber) {
        var deferredPromise = $q.defer();

        portalService.getAgentByInternalId().then(function (agent) {
            $resource(quoteByNumberUrl, { agentId: agent.agentId, quoteNumber: quoteNumber }).get().$promise.then(function (results) {
                if (results.policy == undefined) {
                    deferredPromise.reject(results);
                }
                else {
                    deferredPromise.resolve(results);
                }
            });
        });

        return deferredPromise.promise;
    }

    function emailQuickQuote(quickQuoteRequest) {
        var emailQuoteApi = $resource(quickQuoteEmailUrl, { },
                                                { emailQuote: { method: 'POST', isArray: true } });
        return emailQuoteApi.emailQuote(quickQuoteRequest).$promise;
    }
}
})();
