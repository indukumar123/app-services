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
        .factory('quickQuotesService', quickQuotesService);

    quickQuotesService.$inject = ['$rootScope', '$resource', '$q', '$state', 'settings', 'customersService', 'lookupDataService', 'utilService', '$modal', '$sessionStorage', 'portalService', '$window', 'dataservice', 'storage', 'quotes'];
    var quoteByIdUrl = '/APIProxy/agents/:agentId/smartquotes';
    var packagesByIdUrl = '/APIProxy/agency/:agencyId/Products/:state';
    var packageConfigurationUrl = '/APIProxyV2/BHTP/clients/Eligibility/ProductStateMetadata/:packageId/:state';

    function quickQuotesService($rootScope, $resource, $q, $state, settings, customersService, lookupDataService, utilService, $modal, $sessionStorage, portalService, $window, dataservice, storage, quotes) {
        return {
            getCombinedQuoteRequest: getCombinedQuoteRequest,
            getQuotes: getQuotes,
            getAgencyPackages: getAgencyPackages,
            getVMState: getVMState,
            setVMState: setVMState,
            isVmState: isVmState,
            getPackageConfiguration: getPackageConfiguration,
            storeQuickQuoteData: storeQuickQuoteData
        };

        /**
        * @description
        * retrieves blank quote request
        */
        function getCombinedQuoteRequest(customer) {
            // setup cta to match PurchaseData typescript model
            var cta = {};

            cta.destinationCountry = {
                isoCode2: '',
                name: ''
            };
            cta.residenceState = null;

            cta.departureDate = null;
            cta.returnDate = null;
            cta.depositDate = null;
            cta.primaryTraveler = {
                isPrimary: true,
                birthDate: null,
                tripCost: null,
                emailGroup: {
                    email: '',
                    noEmail: false
                },
                address: {
                    address1: null,
                    address2: null,
                    city: null,
                    stateOrProvince: null,
                    postalCode: null
                }
            };
            cta.additionalTravelers = [];

            if (customer) {
                if (customer.birthDate) {
                    cta.primaryTraveler.birthDate = moment(customer.birthDate).format('YYYY-MM-DD');
                }
                
                if (customer.address && customer.address.stateOrProvince) {
                    cta.residenceState = customer.address.stateOrProvince;
                }
            }

            return cta;
        }
        /**
        * @description
        * retrieves quote by given quote Id, returns in form of promise
        */
        function getQuotes(cta) {
            var useAgentPassedIn = false;
            var id = portalService.getInternalAgentAuthId();
            if (id) {
                useAgentPassedIn = true;
            }
            
            return portalService.getAgentByInternalId(id, useAgentPassedIn).then(function (agent) {
                var smartQuotesApi = $resource(quoteByIdUrl, { agentId: agent.agentId },
                                                 { request: { method: 'POST', isArray: true } });
                cta.agentCode = agent.agentCode;
                return smartQuotesApi.request(cta).$promise;
            });
        }

        /**
       * @description
       * retrieves quote by given quote Id, returns in form of promise
       */
        function getAgencyPackages(cta) {
            var useAgentPassedIn = false;
            var id = portalService.getInternalAgentAuthId();
            if (id) {
                useAgentPassedIn = true;
            }            

            return portalService.getAgentByInternalId(id, useAgentPassedIn).then(function (agent) {
                var agencyPackagesApi = $resource(packagesByIdUrl,
                                {
                                    agencyId: agent.agencyId, state: cta.residenceState
                                },
                                {
                                    request: { method: 'GET', isArray: true }
                                });
                return agencyPackagesApi.request().$promise;
            });
        }

        /**
       * @description
       * gets vm.state in session
       */
        function getVMState() {
            return JSON.parse($window.sessionStorage.getItem('vm.state'));
        }

        /**
      * @description
      * sets vm.state in session
      */
        function setVMState(state) {
            $window.sessionStorage.setItem('vm.state', JSON.stringify(state));
        }

        /**
      * @description
      * returns true if vm.state is in session
      */
        function isVmState() {
            if ($window.sessionStorage.getItem('vm.state')) {
                return true;
            }
            else {
                return false;
            }
        }

        function getPackageConfiguration(packageId, state)
        {
            var packageConfigurationApi = $resource(packageConfigurationUrl, { packageId: packageId, state: state },
                                                 { request: { method: 'GET', isArray: false } });
            return packageConfigurationApi.request().$promise;
        }

        function storeQuickQuoteData( quoteToStore, quickQuoteData, selectedPackage ) {
            ///<summary>Stores the quote model and the quickQuoteData prior to leaving the
            ///     quick quote page.  If going to a partner package, e.g., it will map the
            ///     quick quote data to the correct properties on the quote model being stored.</summary>

            // exit if no quote to store.
            if ( !quoteToStore ) {
                return;
            }

            var agentPromise = portalService.getAgentByInternalId( null, true, false );

            return agentPromise.then( function ( agent ) {
                // have to make another call to get the package configs that have a flag
                //  to indicate whether they are partner packages or not.
                dataservice.getPackageStateConfigs( agent.agentId ).then(
                    function ( packages ) {
                        var isPartnerPackage = false;

                        // find the current selected package in this new package list.
                        if ( packages && packages.length > 0 ) {
                            for ( var i = 0; i < packages.length; i++ ) {
                                if ( packages[i].id === selectedPackage.id ) {
                                    isPartnerPackage = !!packages[i].partnerPackage;
                                    break;
                                }
                            }
                        }

                        if ( !isPartnerPackage ) {
                            // package stays within agent portal; set quote data as normal.
                            storage.set( "quickQuote", quoteToStore );
                        }
                        else {
                            if (quickQuoteData){
                                // package goes to partners screen; set quote data and store it differently, so partners can populate controls properly.
                                if (quickQuoteData.departureDate) {
                                    quoteToStore.departureDate = quickQuoteData.departureDate;
                                }
                                if (quickQuoteData.returnDate) {
                                    quoteToStore.returnDate = quickQuoteData.returnDate;                                
                                }
                                if(quickQuoteData.destination && quickQuoteData.destination.country && quickQuoteData.destination.country.isoCode2) {
                                    quoteToStore.destination = quickQuoteData.destination.country.isoCode2;
                                }
                                if (quickQuoteData.residenceState) {
                                    quoteToStore.state = quickQuoteData.residenceState;
                                }
                                if ( quickQuoteData.primaryTraveler && quickQuoteData.primaryTraveler.tripCost ) {
                                    quoteToStore.totalTripCost = quickQuoteData.primaryTraveler.tripCost;
                                }
                            }

                            quotes.setCurrentQuote( quoteToStore );
                        }
                    }
                );

            } );
        }
    }
})();