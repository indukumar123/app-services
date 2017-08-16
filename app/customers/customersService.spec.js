/* jshint -W117, -W030 */
global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('customersService', function () {

    var removeCustomerResultGood = mockData.getMockRemoveCustomerResponseGood();
    var removeCustomerResultBad = mockData.getMockRemoveCustomerResponseBad();

    var removeCustomerUrl = '/apiproxyv2/bhtp/clients/v1/Customer/1/AA1234';
    var agentServiceUrl = "/APIProxy/Agents?auth0Id=";
    var customersService;

    beforeEach(module('agentPortal'));

    var $httpBackend;
    var $httpFlush;
    var customerService;
    var root;
    var utilService;
    var portalService;
    var q;

    beforeEach(inject(function (_$httpBackend_, _customersService_, _utilService_, _$rootScope_, _portalService_, $q) {
        $httpBackend = _$httpBackend_;
        customersService = _customersService_;
        utilService = _utilService_;
        root = _$rootScope_;
        portalService = _portalService_;
        q = $q;
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    describe('customerService Should be defined', function () {
        it('should be created successfully', function () {
            expect(customersService).toBeDefined();
        });
    });

    describe('removeCustomer modal', function () {
        beforeEach(function () {
            $httpBackend.when('Delete', removeCustomerUrl).respond(200, removeCustomerResultGood);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('Modal options are set', function () {
            customersService.removeCustomer('1', 'customers', 'Joshua', 'Werra', null);
            root.$apply();
            expect(root.confirmoptions).toBeDefined();
            expect(root.confirmoptions.title).toBeDefined();
            expect(root.confirmoptions.mainmessage).toBeDefined();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
        });
    });

    describe('removeCustomer modal no selection', function () {
        beforeEach(function () {
            $httpBackend.when('Delete', removeCustomerUrl).respond(200, removeCustomerResultGood);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('No is selected', function () {
            customersService.removeCustomer('1', 'customers', 'Joshua', 'Werra', null);
            root.$apply();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
            expect(root.confirmoptions.modalbuttons[0].name).toEqual('No');
            root.confirmoptions.modalbuttons[0].action();
            var windowOpen = $('#popupconfirmwithoptionsnomessages').is(':visible');
            expect(windowOpen).toEqual(false);
        });
    });

    describe('removeCustomer modal yes selection', function () {
        beforeEach(function () {
            $httpBackend.when('DELETE', removeCustomerUrl).respond(200, removeCustomerResultGood);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('Yes is selected', function () {
            customersService.removeCustomer('1', 'customers', 'Joshua', 'Werra', null);
            root.$apply();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
            expect(root.confirmoptions.modalbuttons[1].name).toEqual('Yes');
            root.confirmoptions.modalbuttons[1].action();
            $httpFlush();
            var windowOpen = $('#popupconfirmwithoptionsnomessages').is(':visible');
            expect(windowOpen).toEqual(false);
            
            expect(root.popup).toBeDefined();
            expect(root.popup.title).toBeDefined();
            expect(root.popup.message).toBeDefined();
            expect(root.popup.icon).toBeDefined();

            expect(root.popup.title).toEqual('Message');
            expect(root.popup.message).toEqual('The customer has been removed.');
            expect(root.popup.icon).toEqual('fa fa-exclamation-circle fa-icon-medium');
        });
    });

    describe('removeCustomer modal yes selection', function () {
        beforeEach(function () {
            $httpBackend.when('DELETE', removeCustomerUrl).respond(200, removeCustomerResultGood);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('Yes is selected with no redirect', function () {
            customersService.removeCustomer('1', null, 'Joshua', 'Werra', null);
            root.$apply();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
            expect(root.confirmoptions.modalbuttons[1].name).toEqual('Yes');
            root.confirmoptions.modalbuttons[1].action();
            $httpFlush();
            var windowOpen = $('#popupconfirmwithoptionsnomessages').is(':visible');
            expect(windowOpen).toEqual(false);

            expect(root.popup).toBeDefined();
            expect(root.popup.title).toBeDefined();
            expect(root.popup.message).toBeDefined();
            expect(root.popup.icon).toBeDefined();

            expect(root.popup.title).toEqual('Message');
            expect(root.popup.message).toEqual('The customer has been removed.');
            expect(root.popup.icon).toEqual('fa fa-exclamation-circle fa-icon-medium');
        });
    });

    describe('removeCustomer modal yes selection', function () {
        beforeEach(function () {
            $httpBackend.when('DELETE', removeCustomerUrl).respond(200, removeCustomerResultGood);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('Yes is selected with with refresh function', function () {
            customersService.removeCustomer('1', null, 'Joshua', 'Werra', function () { alert('refreshed')});
            root.$apply();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
            expect(root.confirmoptions.modalbuttons[1].name).toEqual('Yes');
            root.confirmoptions.modalbuttons[1].action();
            $httpFlush();
            var windowOpen = $('#popupconfirmwithoptionsnomessages').is(':visible');
            expect(windowOpen).toEqual(false);

            expect(root.popup).toBeDefined();
            expect(root.popup.title).toBeDefined();
            expect(root.popup.message).toBeDefined();
            expect(root.popup.icon).toBeDefined();

            expect(root.popup.title).toEqual('Message');
            expect(root.popup.message).toEqual('The customer has been removed.');
            expect(root.popup.icon).toEqual('fa fa-exclamation-circle fa-icon-medium');
        });
    });

    describe('removeCustomer modal yes selection', function () {
        beforeEach(function () {
            $httpBackend.when('DELETE', removeCustomerUrl).respond(500, removeCustomerResultBad);
            agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(customersService.removeCustomer).toBeDefined();
        });

        it('Yes is selected with error', function () {
            customersService.removeCustomer('1', null, 'Joshua', 'Werra', function () { alert('refreshed') });
            root.$apply();
            expect(root.confirmoptions.modalbuttons).toBeDefined();
            expect(root.confirmoptions.modalbuttons.length).toEqual(2);
            expect(root.confirmoptions.modalbuttons[1].name).toEqual('Yes');
            root.confirmoptions.modalbuttons[1].action();
            $httpFlush();
            var windowOpen = $('#popupconfirmwithoptionsnomessages').is(':visible');
            expect(windowOpen).toEqual(false);

            expect(root.popup).toBeDefined();
            expect(root.popup.title).toBeDefined();
            expect(root.popup.message).toBeDefined();
            expect(root.popup.icon).toBeDefined();

            expect(root.popup.title).toEqual('Message');
            expect(root.popup.message).toEqual('Somthing went wrong while removing the customer.');
            expect(root.popup.icon).toEqual('fa fa-exclamation-circle fa-icon-medium fa-icon-error');
        });
    });
});