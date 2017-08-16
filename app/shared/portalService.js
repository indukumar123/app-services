(function () {
    'use strict';

    var myAppModule = angular.module('agentPortal');

    /**
     * @ngdoc service
     * @name portalService
     *
     * # portalService
     *
     * @description
     * service to perform one-time data-loading functions  and some utility methods to interact with the backend
     */
    myAppModule.service('portalService', ['$q', '$resource', 'auth', '$http', 'storage', 'agents', 'cacheService', '$rootScope', '$filter', portalService]);

    var statesUrl = "/APIProxy/states";
    var statesForAgentUrl = "/APIProxy/states?agentId=:agentId";
    // Partner API replacement for middleware
    var packagesForAgentApiUrl = "/APIProxyV2/BHTP/clients/v1/Licenses/Agreements/:agentCode";
    var packagesForAgentByState = "/APIProxyV2/BHTP/clients/v1/Licenses/:agentCode";
    var statesForBhtpUrl = "/APIProxy/agency/:agencyId/states";
    var productsUrl = "/APIProxy/Products";
    var packagesUrl = "/APIProxy/Products/:productId";
    // Clients API replacement for middleware
    var packagesApiUrl = " /APIProxyV2/BHTP/clients/v1/PackagesFullData";
    var expiredPackagesUrl = "/APIProxy/products/expiredPackages/:productId";
    var countriesUrl = "/APIProxy/Country";
    var PostalCodeUrl = "/APIProxy/PostalCode/Verify/:code";
    var PostalCodeWithStateUrl = "/APIProxy/PostalCode/VerifyByState/:code/:state";
    var AgentUrl = "/APIProxy/Agency/:agencyId/Agents";
    var DRPAgentUrl = "/APIProxy/Agency/:agencyId/GetDRPAgent";
    var agentServiceUrl = "/APIProxy/Agents?auth0Id=";
    var licenseUrl = '/apiproxyv2/bhtp/clients/v1/Licenses/:agentCode/:state/:ratingId'
    var agencyPackagesUrl = "/APIProxy/agency/:agencyId/Products/:state";
    var agencyExpiredPackagesUrl = "/APIProxy/agency/:agencyId/ExpiredPackages";

    function portalService($q, $resource, auth, $http, storage, agents, cacheService, $rootScope, $filter) {

        var currentAgentInternalAuthId = null;
        var currentAgentIsAmbassador = false;
        var currentAgentCanInvoice = false;
        var currentAgentCanUsePoints = false;
        var currentAgentCanUseBulkPolicies = false;
        var currentAgentIsLoggedIn = false;
        var currentAgentIsDRP = false;
        var agentInitialized = false;
        var currentAgent = {};

        function packageComparator(pkg1, pkg2) {
            if (pkg1.name < pkg2.name)
                return -1;
            if (pkg1.name > pkg2.name)
                return 1;
            return 0;
        }

        // invalidate the cache on a 5 minute interval
        function executeGetWithCache(url, data, isArray) {
            cacheService.invalidateCacheIfNeeded();
            return $resource(url, data, { get: { cache: true, method: 'GET', isArray: isArray } }).get().$promise;
        }

        /**
         * @description
         * retrieves countries
         */

        function loadCountries() {
            return executeGetWithCache(countriesUrl, {}, true);
        }

        /**
         * @description
         * retrieves states
         */
        function loadStates() {
            return executeGetWithCache(statesUrl, {}, false);
        }

        /**
         * @description
         * retrieves applicable states for given agent
         */
        function loadStatesForAgent(agentId) {
            return executeGetWithCache(statesForAgentUrl, { agentId: agentId }, false);
        }

        /**
         * @description
         * retrieves applicable states for given agent from api
         */
        function loadPackagesForAgentApi(agentCode) {
            return executeGetWithCache(packagesForAgentApiUrl, { agentCode: agentCode }, false)
                    .then(function (promise) {
                        mapPackageIconCssClasses(promise.packages);
                        return promise;
                    });
        }

        function loadPackagesForAgentByState(agentCode) {
            return executeGetWithCache(packagesForAgentByState, { agentCode: agentCode }, false)
                    .then(function (promise) {
                        if (!promise || !promise.states || promise.states.length < 1){
                            return promise;
                        }

                        for (var i = 0; i < promise.states.length; i++) {
                            mapPackageIconCssClasses(promise.states[i].packages);
                        }

                        return promise;
                    });
        }

        function mapPackageIconCssClasses(packages) {
            if (!packages || packages.length < 1) {
                return;
            }

            for (var i = 0; i < packages.length; i++) {
                var p = packages[i];

                if (!p) {
                    continue;
                }

                var cssClass = '';

                switch ((p.packageIconType || '').toLowerCase()) {
                    case 'aircare':
                    case 'aircareenhanced':
                        // both aircares use the same, new icon.
                        cssClass = 'bhtp-aircare';
                        break;
                    case 'exactcare':
                        cssClass = 'bhtp-exactcare-traditional';
                        break;
                    case 'exactcareenhanced':
                        cssClass = 'bhtp-exactcare';
                        break;
                    case 'exactcarefamily':
                        cssClass = 'bhtp-exactcare-family-traditional';
                        break;
                    case 'exactcareextraenhanced':
                        cssClass = 'bhtp-exactcare-extra';
                        break;
                    case 'exactcarevalueenhanced':
                        cssClass = 'bhtp-exactcare-value';
                        break;
                    case 'vacationguard':
                        cssClass = 'bhtp-vacation-rental';
                        break;
                    default:
                        cssClass = 'bhtp-product-default';
                }

                p.iconCssClass = cssClass;
            }

            return;
        }

        /**
         * @description
         * retrieves applicable states for bhtp agent
         */
        function loadStatesForBhtp(agencyId) {
            return executeGetWithCache(statesForBhtpUrl, { agencyId: agencyId }, false);
        }

        /**
         * @description
         * retrieves products information 
         */
        function loadProducts() {
            return executeGetWithCache(productsUrl, { }, true);
        }

        /**
         * @description
         * retrieves packages information from api
         */
        function loadPackagesApi() {
            return executeGetWithCache(packagesApiUrl, { }, true);
        }

        /**
         * @description
         * retrieves products information 
         */
        function loadAgents(agencyId) {
            return executeGetWithCache(AgentUrl, { agencyId: agencyId }, true);
        }

        /**
         * @description
         * retrieves products information 
         */
        function loadDRPAgent(agencyId) {
            return executeGetWithCache(DRPAgentUrl, { agencyId: agencyId }, false);
        }

        function loadConfig() {
            var deferredAgent = $q.defer();
            cacheService.invalidateCacheIfNeeded();
            $http.get('/Config/AppSettings', { cache: true })
                .then(function (response) {
                    deferredAgent.resolve(response.data);
                })
                .catch(function (data, status) {
                    deferredAgent.reject(status);
                });
            return deferredAgent.promise;
        }

        function getAgentByInternalAuthId(id) {
            var url = agentServiceUrl + id;
            cacheService.invalidateCacheIfNeeded();
            return $http.get(url, { cache: true })
                    .then(function handleAgentSuccess(data) {
                        var superuserroles = global_bhtp_superUserRoles.split(';');
                        var ambassadorRoles = global_bhtp_ambassadorRoles.split(';');
                        var user = data.data;
                        if (user.role) {
                            user.role = user.role.toLowerCase();
                        }
                        else {
                            user.role = null;
                        }
                        user.isSuperUser = superuserroles.indexOf(user.role) > -1;
                        user.isAmbassador = ambassadorRoles.indexOf(user.role) > -1;

                        return user;
                    })
                    .catch(function handleAgentError(error) {
                        return error;
                    });
        }

        // bypassAgentCodeCheck is the hack put in so that Geico can sell using BHTP products
        function getAgentByInternalId(id, useAgentPassedIn, bypassAgentCodeCheck) {
            if (id == null) {
                if (auth.profile) {
                    id = auth.profile.user_id;
                }
                else if (storage.get('auth')) {
                    id = storage.get('auth').profile.user_id;
                }
            }

            if (id !== null) {
                return getAgentByInternalAuthId(id);
            }
        }

        /**
         * @description
         * retrieves check for availability of packages
         */
        function isPackageAvailable(Pckage) {
            var availablePlatform = Pckage.availablePlatform;

            //If no platform set in salesforce
            if (availablePlatform == null) {
                return false;
            }

            var availablePlatformArray = availablePlatform.split(';');
            //Loop through packages
            for (var i = 0; i < availablePlatformArray.length; i++) {
                //If package available in salesforce
                if (availablePlatformArray[i].toLowerCase() == 'agent') {
                    return true;
                }
            }

            //If package not found
            return false;
        }

        /**
         * @description
         * retrieves product packages related information for the currently logged in agent from the clients api
         */
        function loadProductsPackagesFromClientsApi() {
            var deferredProducts = $q.defer();

            var packages = [];
            var productsProcessed = 0;
            var promises = [];

            
            promises.push(loadPackagesApi().then(function (response) {
                if (response) {

                    for (var j = 0; j < response.length; j++) {
                        response[j].actualName = response[j].name;
                        if (response[j].name === 'Aircare') {
                            response[j].name = 'AirCare';
                        }
                        if (isPackageAvailable(response[j])) {
                            response[j].isExpiredPackages = false;
                            packages.push(response[j]);
                        }
                    }
                    productsProcessed++;
                }
            }));
            $q.all(promises)
                    .then(function () {
                        packages.sort(packageComparator);
                        deferredProducts.resolve({ packages: packages });
                    })
                    .catch(function (error) {
                        console.warn("Failed while loading product data %o", error);
                        deferredProducts.reject("Failed while loading product data");
                    });

            return deferredProducts.promise;
        }

        /**
         * @description
         * retrieves product packages related information for the currently logged in agent
         */
        function loadProductsAndPackages(singleProduct, singlePackage) {
            var deferredProducts = $q.defer();

            loadProducts().then(function (products) {
                var packages = [];
                var productsProcessed = 0;
                var promises = [];

                if (singleProduct) {
                    products = $filter('filter')(products, singleProduct);
                }

                for (var i = 0; i < products.length; i++) {
                    var productId = products[i].productId;
                    cacheService.invalidateCacheIfNeeded();
                    var packageApi = $resource(packagesUrl, { productId: productId }, { get: { cache: true, method: 'GET' }});
                    promises.push(packageApi.get().$promise.then(function (response) {
                        if (response.packages) {
                            if (singlePackage) {
                                response.packages = $filter('filter')(response.packages, singlePackage);
                            }

                            for (var j = 0; j < response.packages.length; j++) {
                                response.packages[j].actualName = response.packages[j].name;
                                if (response.packages[j].name === 'Aircare') {
                                    response.packages[j].name = 'AirCare';
                                }
                                response.packages[j].productName = response.productName;
                                response.packages[j].productId = response.productId;
                                if (isPackageAvailable(response.packages[j])) {
                                    response.packages[j].isExpiredPackages = false;
                                    packages.push(response.packages[j]);
                                }
                            }
                            productsProcessed++;
                            return loadExpiredPackages(products, packages, response.productId, productsProcessed);
                        }
                    }));
                }

                $q.all(promises)
                    .then(function () {
                        packages.sort(packageComparator);
                        deferredProducts.resolve({ products: products, packages: packages });
                    })
                    .catch(function (error) {
                        console.warn("Failed while loading product data %o", error);
                        deferredProducts.reject("Failed while loading product data");
                    });
            });

            return deferredProducts.promise;
        }

        function loadExpiredPackages(products, packages, productId, productsProcessed) {
            cacheService.invalidateCacheIfNeeded();
            var expiredPackageApi = $resource(expiredPackagesUrl, { productId: productId }, { get: { method: 'GET', cache: true } });

            return expiredPackageApi.get().$promise.then(function (response) {
                if (response.packages) {
                    for (var j = 0; j < response.packages.length; j++) {
                        response.packages[j].actualName = response.packages[j].name;
                        if (response.packages[j].name === 'Aircare') {
                            response.packages[j].name = 'AirCare';
                        }
                        response.packages[j].productName = response.productName;
                        response.packages[j].productId = response.productId;
                        if (isPackageAvailable(response.packages[j])) {
                            response.packages[j].isExpiredPackages = true;
                            packages.push(response.packages[j]);
                        }
                    }
                }
            }, function (error) {
                console.warn("Failed while loading packages %o", error);
            });
        }

        /**
         * @description
         * retrieves product packages related information for the currently logged in agent
         */
        function loadAgencyProductsAndPackages(agencyId) {
            var deferredProducts = $q.defer();

            loadProducts().then(function (products) {
                var packages = [];
                var productsProcessed = 0;
                var promises = [];

                cacheService.invalidateCacheIfNeeded();
                var agencyExpiredPackageApi = $resource(agencyExpiredPackagesUrl, { agencyId: agencyId }, { get: { method: 'GET', isArray: true } });
                promises.push(agencyExpiredPackageApi.get().$promise.then(function (response) {
                    if (response.length > 0) {
                        for (var i = 0; i < response.length; i++) {
                            packages.push(response[i]);
                        }
                    }
                }));

                $q.all(promises)
                    .then(function () {
                        packages.sort(packageComparator);
                        deferredProducts.resolve({ products: products, packages: packages });
                    })
                    .catch(function (error) {
                        console.warn("Failed while loading product data %o", error);
                        deferredProducts.reject("Failed while loading product data");
                    });
            });

            return deferredProducts.promise;
        }

        function getStateLicense(state, agentCode, ratingId)
        {
            var licenseApi = $resource(licenseUrl, { state: state, agentCode: agentCode, ratingId: ratingId }, { get: { method: 'GET', isArray: false } });
            return licenseApi.get().$promise;
        }

        function shouldPreventAuthIdBypass(authId) {
            var auth0IdsToBypass = $rootScope.config.CLIENT_AUTH0_BYPASS_IDS != null ? $rootScope.config.CLIENT_AUTH0_BYPASS_IDS.split(';') : [];
            var cleanAuthId = authId.replace('auth0|', 'auth0');
            return auth0IdsToBypass.indexOf(cleanAuthId) >= 0;
        }

        return {

            /**
             * @description
             * utility method to post data to URL - probably not used anymore 
             */
            postJsonToURL: function (url, postData) {
                var deferredAgent = $q.defer();

                $http.post(url, postData)
                    .then(function (result) {
                        deferredAgent.resolve(result.data);
                    }).catch(
                    function (data, status) {
                        deferredAgent.reject(status);
                    });
                return deferredAgent.promise;
            },

            /**
             * @description
             * retrieves configuration described in Web.config file from server
             */
            loadConfig: loadConfig,

            /**
             * @description
             * verify postal code
             */
            VerifyPostalCode: function (value, success, error) {
                var PostalCodeApi = $resource(PostalCodeUrl, { code: value });
                return PostalCodeApi.get().$promise.then(function (response) {
                    if (success) {
                        success(response);
                    }
                }, error);
            },

            /**
             * @description
             * verify postal code by state
             */
            VerifyPostalCodeWithState: function (value, state, success, error) {
                var PostalCodeWithStateApi = $resource(PostalCodeWithStateUrl, { code: value, state: state });
                return PostalCodeWithStateApi.get().$promise.then(function (response) {
                    if (success) {
                        success(response);
                    }
                }, error);
            },

            /**
             * @description
             * get agents by agencyId
             */
            loadAgentsForAgency: function (agencyId) {
                return loadAgents(agencyId);
            },

            /**
             * @description
             * get drp agent by agencyId
             */
            loadDRPAgentForAgency: function (agencyId) {
                var DRPAgentApi = $resource(DRPAgentUrl, { agencyId: agencyId });
                return DRPAgentApi.get().$promise;
            },

            loadStates: loadStates,
            loadStatesForAgent: loadStatesForAgent,
            loadPackagesForAgentApi: loadPackagesForAgentApi,
            loadPackagesForAgentByState: loadPackagesForAgentByState,
            loadProductsAndPackages: loadProductsAndPackages,
            loadProductsPackagesFromClientsApi: loadProductsPackagesFromClientsApi,
            loadAgencyProductsAndPackages:loadAgencyProductsAndPackages,
            loadCountries: loadCountries,
            isPackageAvailable: isPackageAvailable,

            setInternalAgentAuthId: function(id){
                currentAgentInternalAuthId = id;
            },

            getInternalAgentAuthId: function(){
                return currentAgentInternalAuthId;
            },

            /*
            * Get the agent information by passing in the auth0 Id of the agent
            */
            getAgentByInternalId: getAgentByInternalId,

            initializeAgent: function (id) {
                var deferredAgent = $q.defer();
                var agentResp = {};
                getAgentByInternalId(id, false).then(function (agent) {
                    if (agent) {
                        agentResp = agent;

                        var currentAgentCode = agents.getCurrentAgentCode();
                        if (!currentAgentCode || currentAgentCode === null || currentAgentCode === agent.agentCode) {
                            agents.refreshCurrentAgent(agent.agentCode)
                            .then(function (apiAgent) {
                                if (apiAgent) {
                                    currentAgentCanUsePoints = apiAgent.canUsePoints;
                                    currentAgentCanInvoice = apiAgent.canInvoice;
                                    currentAgentCanUseBulkPolicies = apiAgent.canInvoice && apiAgent.batchPolicyTemplate === "BHTP";
                                    currentAgentIsDRP = apiAgent.isDRP;
                                    agentResp.currentAgentCanInvoice = currentAgentCanInvoice;
                                    agentResp.currentAgentCanUsePoints = currentAgentCanUsePoints;
                                    agentResp.currentAgentCanUseBulkPolicies = currentAgentCanUseBulkPolicies;
                                    agentResp.currentAgentIsDRP = currentAgentIsDRP;
                                }

                                currentAgent = agentResp;
                                agentInitialized = true;
                                currentAgentIsLoggedIn = true;
                                currentAgentIsAmbassador = agent.isAmbassador;
                                deferredAgent.resolve(agentResp);
                            });
                        }
                        else {
                            // check the current logged in agent
                            agents.refreshCurrentAgent(agent.agentCode)
                            .then(function (apiAgent) {
                                if (apiAgent) {
                                    currentAgentCanUsePoints = apiAgent.canUsePoints;
                                    currentAgentCanInvoice = apiAgent.canInvoice;
                                    currentAgentCanUseBulkPolicies = apiAgent.canInvoice && apiAgent.batchPolicyTemplate === "BHTP";
                                    currentAgentIsDRP = apiAgent.isDRP;
                                    agentResp.currentAgentCanInvoice = currentAgentCanInvoice;
                                    agentResp.currentAgentCanUsePoints = currentAgentCanUsePoints;
                                    agentResp.currentAgentCanUseBulkPolicies = currentAgentCanUseBulkPolicies;
                                    agentResp.currentAgentIsDRP = currentAgentIsDRP;
                                }

                                // check the agent passed in on the url
                                agents.refreshCurrentAgent(currentAgentCode)
                                .then(function (apiAgent) {
                                    currentAgent = agentResp;
                                    agentInitialized = true;
                                    currentAgentIsLoggedIn = true;
                                    currentAgentIsAmbassador = agent.isAmbassador;
                                    deferredAgent.resolve(agentResp);
                                });
                            });
                        }
                    }
                });

                return deferredAgent.promise;
            },

            loadStatesForBhtp: function () {
                return loadConfig().then(function (config) {
                    return loadStatesForBhtp(config.CLIENT_BHTP_AGENCY_ID).then(function (response) {
                        return response.states;
                    });
                });
            },

            getAgentIsInitialized: function(){
                return agentInitialized;
            },

            getCurrentAgentIsAmbassador: function(){
                return currentAgentIsAmbassador;
            },

            getCurrentAgentCanInvoice: function () {
                return currentAgentCanInvoice;
            },

            getCurrentAgentCanUsePoints: function () {
                return currentAgentCanUsePoints;
            },

            getCurrentAgentCanUseBulkPolicies: function () {
                return currentAgentCanUseBulkPolicies;
            },

            getCurrentAgentIsDRP: function () {
                return currentAgentIsDRP;
            },

            getCurrentAgentIsLoggedIn: function () {
                return currentAgentIsLoggedIn;
            },

            getCurrentAgent: function(){
                return currentAgent;
            },

            logout: function () {
                currentAgentInternalAuthId = null;
                currentAgentIsAmbassador = false;
                currentAgentCanInvoice = false;
                currentAgentCanUsePoints = false;
                currentAgentIsLoggedIn = false;
                currentAgentCanUseBulkPolicies = false;
                currentAgentIsDRP = false;
                agentInitialized = false;
                currentAgent = {};
                agents.removeAgentCookies();
            },

            getStateLicense : getStateLicense
        };
    }

})();