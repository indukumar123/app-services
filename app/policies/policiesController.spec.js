/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('policiesController', function () {
    beforeEach(module('agentPortal'));

    var policiesController;
    var portalService;
    var policiesService;
    var agentService;
    var settings;
    var q;
    var controller;
    var root;
    var agentSpy;
    var utilService;
    var stateParams;
    var succeedPromise = true;

    function initController() {
        policiesController = controller('policiesController', {
            $q: q,
            portalService: portalService,
            policiesService: policiesService,
            agentService: agentService,
            settings: settings
        });

        root.$apply();
    }

    beforeEach(inject(function ($q, _policiesService_, _portalService_, _settings_, _agentService_, _utilService_, $stateParams) {
        portalService = _portalService_;
        policiesService = _policiesService_;
        agentService = _agentService_;
        settings = _settings_;
        utilService = _utilService_;
        stateParams = $stateParams;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(policiesService, 'getProductsGoupedByName').and.returnValue($q.when([{ name: 'Traditional' }]));
        spyOn(policiesService, 'loadAgencyProductsAndPackages').and.returnValue($q.when([{ name: 'Traditional' }]));
        spyOn(utilService, 'getDateRange').and.returnValue(null);

        spyOn(policiesService, 'loadPagedData').and.callFake(
        function () {
            if (succeedPromise) {
                return $q.when({ totalRecords: 2, quotes: [{ packageName: "exactcare", subTitle: null }, { packageName: "aircare", subTitle: "(abroad)" }] });
            }
            else {
                return $q.reject("Something went wrong");
            }
        });

        stateParams.filter = ["1","2"]
    }));

    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        initController();
    }));

    describe('PoliciesController init tests', function () {
        it('should be created successfully', function () {
            expect(policiesController).toBeDefined;
        });

        it('should be ready to display its grid', function () {
            expect(policiesController.ready).toEqual(true);
        });

        it('should have an agent', function () {
            expect(policiesController.agent.agentId).toEqual('AA1234');
        });

        it('should have products', function () {
            expect(policiesController.products.length).toEqual(1);
        });

        it('verify refreshData', function () {
            expect(policiesController.refreshData()).toBeDefined;
        });

        it('verify reloadData', function () {
            expect(policiesController.reloadData()).toBeDefined;
        });

        it('verify filterChanged', function () {
            expect(policiesController.filterChanged()).toBeDefined;
        });

        it('verify searchChanged', function () {
            expect(policiesController.searchChanged()).toBeDefined;
        });

        it('verify clearFilter', function () {
            expect(policiesController.clearFilter()).toBeDefined;
        });

        it('verify getCustomFilters to 5', function () {
            expect(policiesController.getCustomFilters().length).toEqual(5);
        });

        it('verify getCustomFilters to 5 with filterd agent', function () {
            policiesController.agent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            policiesController.filteredAgent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            expect(policiesController.getCustomFilters().length).toEqual(5);
        });

        it('verify getCustomFilters to 5 without filterd agent', function () {
            policiesController.agent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            policiesController.filteredAgent = null;
            expect(policiesController.getCustomFilters().length).toEqual(5);
        });

        it('verify loadData asc', function () {
            policiesController.filteredDate = null;
            policiesController.searchText = null
            expect(policiesController.loadData()).toBeDefined;
        });

        it('verify loadData desc', function () {
            policiesController.filteredAgent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true }
            policiesController.gridConfig.reverse = true;
            policiesController.filteredDate = null;
            policiesController.searchText = null
            expect(policiesController.loadData()).toBeDefined;
        });

        describe('PoliciesController agent is super user tests', function () {
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
