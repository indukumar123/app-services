/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('quotesController', function () {
    beforeEach(module('agentPortal'));

    var quotesController;
    var portalService;
    var quoteService;
    var agentService;
    var settings;
    var q;
    var controller;
    var root;
    var agentSpy;
    var utilService;
    var succeedPromise = true;

    function initController() {
        quotesController = controller('quotesController', {
            $q: q,
            portalService: portalService,
            quotesService: quoteService,
            agentService: agentService,
            settings: settings,
            utilService: utilService
        });
       
        root.$apply();
    }

    beforeEach(inject(function ($q, _quotesService_, _portalService_, _settings_, _agentService_, _utilService_) {
        portalService = _portalService_;
        quoteService = _quotesService_;
        agentService = _agentService_;
        settings = _settings_;
        utilService = _utilService_;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({ packages: [{ name: 'AirCare' }] }));
        spyOn(quoteService, 'getProductsGoupedByName').and.returnValue($q.when([{ name: 'Traditional' }]));
        spyOn(quoteService, 'loadAgencyProductsAndPackages').and.returnValue($q.when([{ name: 'Traditional' }]));
        spyOn(utilService, 'getDateRange').and.returnValue(null);
        spyOn(quoteService, 'emailQuote').and.returnValue($q.when(true));
        spyOn(quoteService, 'removeQuotes').and.returnValue($q.when(["1"]));
        //spyOn(quoteService, 'loadPagedData').and.returnValue($q.when({ totalRecords: 2, quotes: [{ packageName: "exactcare", subTitle: null }, { packageName: "aircare", subTitle: "(abroad)" }] }));
        
        spyOn(quoteService, 'loadPagedData').and.callFake(
        function () {
            if (succeedPromise) {
                return $q.when({ totalRecords: 2, quotes: [{ packageName: "exactcare", subTitle: null }, { packageName: "aircare", subTitle: "(abroad)" }] });
            }
            else {
                return $q.reject("Something went wrong");
            }
        });
    }));

    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        initController();
    }));

    describe('QuotesController init tests', function () {
        it('should be created successfully', function () {
            expect(quotesController).toBeDefined;
        });

        it('should be ready to display its grid', function () {
            expect(quotesController.ready).toEqual(true);
        });

        it('should have an agent', function () {
            expect(quotesController.agent.agentId).toEqual('AA1234');
        });

        it('should have packages', function () {
            expect(quotesController.packages.length).toEqual(1);
        });

        it('verify refreshData', function () {
            expect(quotesController.refreshData()).toBeDefined;
        });

        it('verify reloadData', function () {
            expect(quotesController.reloadData()).toBeDefined;
        });

        it('verify filterChanged', function () {
            expect(quotesController.filterChanged()).toBeDefined;
        });

        it('verify searchChanged', function () {
            expect(quotesController.searchChanged()).toBeDefined;
        });

        it('verify clearFilter', function () {
            expect(quotesController.clearFilter()).toBeDefined;
        });

        it('verify editQuote', function () {
            expect(quotesController.editQuote({packageId: "4", quoteId:"1"})).toBeDefined;
        });

        it('verify removeQuotes', function () {
            expect(quotesController.removeQuotes(["1"])).toBeDefined;
        });

        it('verify removeQuotes without id', function () {
            expect(quotesController.removeQuotes([])).toBeDefined;
        });

        it('verify refreshSelectionToExclude', function () {
            quotesController.selected = ["1","3"]
            expect(quotesController.refreshSelectionToExclude(["1"])).toBeDefined;
        });

        it('verify confirmRemoveSelectedQuotes', function () {
            expect(quotesController.confirmRemoveSelectedQuotes()).toBeDefined;
        });

        it('verify getCustomFilters to 3', function () {
            expect(quotesController.getCustomFilters().length).toEqual(3);
        });

        it('verify getCustomFilters to 3 with filterd agent', function () {
            quotesController.agent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            quotesController.filteredAgent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            expect(quotesController.getCustomFilters().length).toEqual(3);
        });

        it('verify getCustomFilters to 3 without filterd agent', function () {
            quotesController.agent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true };
            quotesController.filteredAgent = null;
            expect(quotesController.getCustomFilters().length).toEqual(3);
        });

        it('verify emailQuote', function () {
            expect(quotesController.emailQuote("1", "")).toBeDefined;
        });

        it('verify sendQuote', function () {
            expect(quotesController.sendQuote({})).toBeDefined;
        });

        it('verify confirmRemoveQuote', function () {
            expect(quotesController.confirmRemoveQuote({ quoteId: "1" })).toBeDefined;
        });

        it('verify loadData asc', function () {
            quotesController.filteredDate = null;
            quotesController.searchText = null
            succeedPromise = true;
            expect(quotesController.loadData()).toBeDefined;
        });

        it('verify loadData asc with error', function () {
            quotesController.filteredDate = null;
            quotesController.searchText = null
            succeedPromise = false;
            expect(quotesController.loadData()).toBeDefined;
        });
        
        it('verify loadData desc', function () {
            quotesController.filteredAgent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: true }
            quotesController.gridConfig.reverse = true;
            quotesController.filteredDate = null;
            quotesController.searchText = null
            expect(quotesController.loadData()).toHaveBeenCalled;
        });
        
        describe('QuotesController agent is super user tests', function () {
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
