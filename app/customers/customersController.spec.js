/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('customersController', function () {
    beforeEach(module('agentPortal'));

    var customersController;
    var portalService;
    var policiesService;
    var agentService;
    var settings;
    var q;
    var controller;
    var root;
    var agentSpy;

    function initController() {
        customersController = controller('customersController', {
            $q: q,
            portalService: portalService,
            policiesService: policiesService,
            agentService: agentService,
            settings: settings
        });

        root.$apply();
    }

    beforeEach(inject(function ($q, _policiesService_, _portalService_, _settings_, _agentService_) {
        portalService = _portalService_;
        policiesService = _policiesService_;
        agentService = _agentService_;
        settings = _settings_;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(portalService, 'loadPackagesForAgentByState').and.returnValue($q.when({ states: [{ name: 'WI' }] }));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({ packages: [{ name: 'AirCare' }] }));
        spyOn(portalService, 'getInternalAgentAuthId').and.returnValue(null);
        spyOn(policiesService, 'getProductsGoupedByName').and.returnValue($q.when([{ name: 'Traditional' }]));
    }));

    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        initController();
    }));

    describe('CustomersController init tests', function () {
        it('should be created successfully', function () {
            expect(customersController).toBeDefined;
        });

        it('should be ready to display its grid', function () {
            expect(customersController.ready).toEqual(true);
        });

        it('should have an agent', function () {
            expect(customersController.agent.agentId).toEqual('AA1234');
        });

        it('should have packages', function () {
            expect(customersController.packages.length).toEqual(1);
        });

        describe('CustomersController agent is super user tests', function () {
            beforeEach(function () {
                agentSpy.and.returnValue(q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true }));
                spyOn(agentService, 'fetchAgents').and.returnValue(q.when([{ agentId: 'AA1234', agencyId: 'A1234' }]));

                initController();
            });

            it('should retrieve other agents in the agency', function () {
                expect(agentService.fetchAgents.calls.count()).toEqual(1);
            });
        });
    });
});
