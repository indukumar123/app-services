/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
global_client_cache_refresh_minutes = 5;
dataLayer = {};

describe('purchaseController', function () {
    beforeEach(module('agentPortal'));

    var purchaseController;
    var portalService;
    var productRatingIds;
    var customersService;
    var q;
    var controller;
    var root;
    var stateParams;
    var dataservice;
    var quotes;
    var state;

    function initController() {
        purchaseController = controller('purchaseController', {
            $q: q,
            portalService: portalService,
            productRatingIds: productRatingIds,
            customersService: customersService
        });

        root.$apply();
    }

    beforeEach(inject(function ($q, _portalService_, _productRatingIds_, _customersService_, _dataservice_, _quotes_) {
        portalService = _portalService_;
        productRatingIds = _productRatingIds_;
        customersService = _customersService_;
        dataservice = _dataservice_;
        quotes = _quotes_;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(portalService, 'loadCountries').and.returnValue($q.when({ countries: [{ name: 'USA' }, { name: 'India' }] }));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({ packages: [{ packageId: "a1gJ0000001Au7wIAC", id: "4", name: 'AirCare', productRatingId: "1" }], products: [{ id: "4", name: 'AirCare' }] }));

        spyOn(portalService, 'loadPackagesForAgentApi').and.returnValue($q.when({
            packages: [
                    { id: '1', name: 'AirCare', availablePlatform: 'Web' },
                    { id: '3', name: 'AirCare', availablePlatform: 'Web' },
                    { id: '4', name: 'ExactCare Famiy', availablePlatform: 'Agent' }
            ]
        }));

        spyOn(dataservice, 'getPackageStateConfigs').and.returnValue($q.when({ packages: [{ packageId: "a1gJ0000001Au7wIAC", id: "4", name: 'AirCare', productRatingId: "1" }] }));

        spyOn(portalService, 'loadStatesForAgent').and.returnValue($q.when(mockData.getMockAgentStates()));

        spyOn(quotes, 'setQuoteResponse').and.returnValue($q.when([{ package: { id: "a1gJ0000001Au7wIAC", ratingId: "4" } }]));
        spyOn(quotes, 'setCurrentQuote').and.returnValue($q.when([{ package: { id: "a1gJ0000001Au7wIAC", ratingId: "4" } }]));
        quotes.setCurrentPackage = function () {
            return true;
        }
        quotes.setCurrentQuote = function () {
            return true;
        }
        quotes.setQuoteResponse = function () {
            return true;
        }
    }));

    describe('methods ', function () {
        beforeEach(inject(function ($controller, _$rootScope_, $q, $stateParams, $state) {
            q = $q;
            controller = $controller;
            root = _$rootScope_;
            stateParams = $stateParams;
            stateParams.packageId = "a1gJ0000001Au7wIAC";
            state = $state;

            initController();

            purchaseController.agent.states = mockData.getMockAgentStates();
            purchaseController.packages = [{ id: "a1gJ0000001Au7wIAC", ratingId: "4", name: 'AirCare', productRatingId: "1" }];
            purchaseController.agentPackages = [{ id: "a1gJ0000001Au7wIAC", ratingId: "4", name: 'AirCare', productRatingId: "1" }];
            purchaseController.package = { ratingId: "4", productRatingId: "1", id: "a1gJ0000001Au7wIAC" };
            purchaseController.packageId = "a1gJ0000001Au7wIAC";
            state.go = function () {
                return true;
            }
        }));

        it(' should be created successfully', function () {
            expect(purchaseController).toBeDefined;
        });
        
        it(' redirect With Package Aircare V2', function () {
            expect(purchaseController.redirectWithPackage).toBeDefined;
        });
    });

    describe('methods with customer', function () {
        beforeEach(inject(function ($controller, _$rootScope_, $q, $stateParams, $state) {
            q = $q;
            controller = $controller;
            root = _$rootScope_;
            stateParams = $stateParams;
            stateParams.packageId = "a1gJ0000001Au7wIAC";
            stateParams.customerId = "4";;
            state = $state;

            initController();

            purchaseController.agent.states = mockData.getMockAgentStates();
            purchaseController.packages = [{ id: "a1gJ0000001Au7wIAC", ratingId: "4", name: 'AirCare', productRatingId: "1" }];
            purchaseController.agentPackages = [{ id: "a1gJ0000001Au7wIAC", ratingId: "4", name: 'AirCare', productRatingId: "1" }];
            purchaseController.package = { ratingId: "4", productRatingId: "1", id: "a1gJ0000001Au7wIAC" };
            purchaseController.packageId = "a1gJ0000001Au7wIAC";

            spyOn(customersService, 'getById').and.returnValue($q.when([{ package: { customerId: "4", name: "name" } }]));
            state.go = function()
            {
                return true;
            }
        }));
        it(' redirect To Traditional Aircare Customer Purchase', function () {
            expect(purchaseController.redirectWithPackage).toBeDefined;
        });

        it(' redirect To Traditional partner Customer Purchase', function () {
            purchaseController.agentPackages = [{ id: "a1gJ0000001Au7wIAC", ratingId: "4", name: 'AirCare', productRatingId: "1", partnerPackage: true }];
            purchaseController.package = { ratingId: "4", productRatingId: "1", id: "a1gJ0000001Au7wIAC", partnerPackage: true };
            expect(purchaseController.redirectWithPackage).toBeDefined;
        });
    });
});