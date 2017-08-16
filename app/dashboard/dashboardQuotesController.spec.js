/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('dashboardQuotesController', function () {
    beforeEach(module('agentPortal'));

    var dashboardQuotesController;
    var portalService;
    var quotesService;
    var agentService;
    var settings;
    var q;
    var controller;
    var root;
    var agentSpy;
    var utilService;
    var succeedPromise = true;
    var $timeout;
    var agentData = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false };
    var dateRangeValue = null;

    function initController() {
        dashboardQuotesController = controller('dashboardQuotesController', {
            $q: q,
            portalService: portalService,
            quotesService: quotesService,
            agentService: agentService,
            settings: settings,
            utilService: utilService
        });
       
        root.$apply();
    }

    beforeEach(inject(function ($q, _quotesService_, _portalService_, _settings_, _agentService_, _utilService_, _$timeout_) {
        portalService = _portalService_;
        quotesService = _quotesService_;
        agentService = _agentService_;
        settings = _settings_;
        utilService = _utilService_;
        $timeout = _$timeout_;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when(agentData));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({
            packages:
                [
                    { id: '1', name: 'AirCare', availablePlatform: 'Web' },
                    { id: '3', name: 'AirCare', availablePlatform: 'Web' },
                    { id: '4', name: 'ExactCare Famiy', availablePlatform: 'Agent' }
                ]
        }));

        spyOn(portalService, 'loadProductsPackagesFromClientsApi').and.returnValue($q.when({
            packages: [
                { id: '1', name: 'AirCare', availablePlatform: 'Web' },
                { id: '3', name: 'AirCare', availablePlatform: 'Web' },
                { id: '4', name: 'ExactCare Famiy', availablePlatform: 'Agent' }
            ]
        }));

        spyOn(quotesService, 'getProductsGoupedByName').and.returnValue($q.when([{ name: 'Traditional' }]));
        spyOn(quotesService, 'loadAgencyProductsAndPackages').and.returnValue($q.when({
            packages:
            [
                { id: '1', name: 'AirCare', availablePlatform: 'Web' },
                { id: '3', name: 'AirCare', availablePlatform: 'Web' },
                { id: '4', name: 'ExactCare Famiy', availablePlatform: 'Agent' }
            ]
        }));
        spyOn(utilService, 'getDateRange').and.returnValue(null);
    }));

    beforeEach(inject(function ($controller, _$rootScope_, $q) {
        q = $q;
        controller = $controller;
        root = _$rootScope_;

        initController();
    }));

    describe('dashboardQuotesController init tests', function () {
        agentData.isSuperUser = false;
        dateRangeValue = null;
        it('should be created successfully', function () {
            expect(dashboardQuotesController).toBeDefined;
        });

        it('customerQuotes.loadData should be created successfully', function () {
            agentData.isSuperUser = false;
            spyOn(quotesService, 'loadPagedData').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            {
                                totalRecords: 3,
                                quotes: [
                                    { packageName: "AirCare", subTitle: null, packageId: '1' },
                                    { packageName: "AirCare", subTitle: "Abroad", packageId: '3' },
                                    { packageName: "ExactCare Family", subTitle: null, packageId: '4' }
                                ]
                            }
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            dashboardQuotesController.customerQuotes.loadData();
            expect(dashboardQuotesController.customerQuotes.gridConfig.totalRecords).toBeDefined;
        });

        it('customerQuotes.reloadData should be created successfully', function () {
            agentData.isSuperUser = false;
            dashboardQuotesController.customerQuotes.reloadData();
            expect(dashboardQuotesController.customerQuotes.reloadDataFlag).toBe(true);
        });

        it('customerQuotes.editQuote should be created successfully', function () {
            agentData.isSuperUser = false;
            expect(dashboardQuotesController.customerQuotes.editQuote({ packageId: '1', quoteId: '12121' })).toBeDefined;
        });

        it('customerQuotes.filterChanged should be created successfully', function () {
            agentData.isSuperUser = false;
            dashboardQuotesController.customerQuotes.filterChanged();
            expect(dashboardQuotesController.customerQuotes.refreshDataFlag).toBe(true);
        });

        it('customerQuotes.clearFilter should be created successfully', function () {
            dashboardQuotesController.customerQuotes.clearFilter();
            expect(dashboardQuotesController.customerQuotes.refreshDataFlag).toBe(true);
        });

        it('customerQuotes.searchChanged should be created successfully', function () {
            agentData.isSuperUser = false;
            dashboardQuotesController.customerQuotes.searchChanged();
            $timeout.flush();
            expect(dashboardQuotesController.customerQuotes.refreshDataFlag).toBe(true);
        });

        it('customerQuotes.confirmRemoveQuote should be created successfully', function () {
            dashboardQuotesController.customerQuotes.confirmRemoveQuote({ quote: '1' });
            expect(dashboardQuotesController.customerQuotes.selectedDeleteIds).toBeDefined;
        });

        it('customerQuotes.removeQuotes without ids should be created successfully', function () {
            expect(dashboardQuotesController.customerQuotes.removeQuotes([])).toBeDefined;
        });

        it('customerQuotes.sendQuote should be created successfully', function () {
            expect(dashboardQuotesController.customerQuotes.sendQuote({ quoteId: '1' })).toBeDefined;
        });

        it('customerQuotes.removeQuotes with ids should be created successfully', function () {
            spyOn(quotesService, 'removeQuotes').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            {

                            }
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            dashboardQuotesController.customerQuotes.selected = ['1', '2', '3'];
            dashboardQuotesController.customerQuotes.removeQuotes(['1', '2']);
            expect(dashboardQuotesController.customerQuotes.selected.length).toBe(3);
        });
    });

    describe('dashboardQuotesController init tests for super user', function () {
        agentData.isSuperUser = true;
        dateRangeValue = { startDate: null, endDate : null};

        it('should be created successfully', function () {
            expect(dashboardQuotesController).toBeDefined;
        });

        it('customerQuotes.searchChanged for super user should be created successfully', function () {
            agentData.isSuperUser = true;
            dashboardQuotesController.customerQuotes.searchChanged();
            $timeout.flush();
            expect(dashboardQuotesController.customerQuotes.refreshDataFlag).toBe(true);
        });

        it('customerQuotes.loadData for super user should be created successfully', function () {
            agentData.isSuperUser = true;
            dateRangeValue = { startDate: null, endDate: null };
            spyOn(quotesService, 'loadPagedData').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            {
                                totalRecords: 3,
                                quotes: [
                                    { packageName: "AirCare", subTitle: null, packageId: '1' },
                                    { packageName: "AirCare", subTitle: "Abroad", packageId: '3' },
                                    { packageName: "ExactCare Family", subTitle: null, packageId: '4' }
                                ]
                            }
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            dashboardQuotesController.customerQuotes.loadData();
            expect(dashboardQuotesController.customerQuotes.gridConfig.totalRecords).toBeDefined;
        });
    });
});
