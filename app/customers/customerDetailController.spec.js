/* jshint -W117, -W030 */
describe('customerDetailController', function () {
    beforeEach(module('agentPortal'));

    var customerDetailController;
    var customersService;
    var agentService;
    var portalService;
    var quotesService;
    var q;
    var root;
    var agentSpy;
    var removeCustomerResultGood = mockData.getMockRemoveCustomerResponseGood();
    var removeCustomerResultBad = mockData.getMockRemoveCustomerResponseBad();
    var customerResponse = mockData.getMockCustomer();
    var agentResponse = { agentId: 'AABBCCDDEE1122334455', agencyId: 'AABBCCDDEE1122334455', isAmbassodor: false };

    function initController() {
        customerDetailController = controller('customerDetailController', {
            $q: q,
            portalService: portalService,
            customersService: customersService,
            quotesService: quotesService
        });

        root.$apply();
    }

    beforeEach(inject(function ($q, _portalService_, _customersService_, _quotesService_) {
        portalService = _portalService_;
        customersService = _customersService_;
        quotesService = _quotesService_;

        customerResponse.gender = "Male";
        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when(agentResponse));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({ packages: [{ name: 'AirCare' }] }));
        spyOn(customersService, 'getById').and.returnValue($q.when(customerResponse));
        spyOn(customersService, 'removeCustomer').and.returnValue($q.when(removeCustomerResultGood));
        spyOn(quotesService, 'loadAgencyProductsAndPackages').and.returnValue($q.when({ packages: [{ name: 'AirCare' }] }));
    }));
    
    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        initController();
    }));

    describe('customerDetailsController init tests', function () {
        it('should be created successfully', function () {
            expect(customerDetailController).toBeDefined;
        });
    });

    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        agentResponse.isSuperUser = true;
        initController();
    }));

    describe('customerDetailsController init tests for super user', function () {
        it('should be created successfully', function () {
            expect(customerDetailController).toBeDefined;
        });
    });

});