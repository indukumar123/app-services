/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('upcomingPoliciesController', function () {
    beforeEach(module('agentPortal'));

    var upcomingPoliciesController;
    var portalService;
    var quotesService;
    var policiesService;
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
        upcomingPoliciesController = controller('upcomingPoliciesController', {
            $q: q,
            portalService: portalService,
            quotesService: quotesService,
            policiesService: policiesService,
            agentService: agentService,
            settings: settings,
            utilService: utilService
        });
       
        root.$apply();
    }

    beforeEach(inject(function ($q, _quotesService_, _portalService_, _settings_, _agentService_, _utilService_, _$timeout_, _policiesService_) {
        portalService = _portalService_;
        quotesService = _quotesService_;
        policiesService= _policiesService_;
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

    describe('upcomingPoliciesController init tests', function () {
        agentData.isSuperUser = false;
        dateRangeValue = null;
        it('should be created successfully', function () {
            expect(upcomingPoliciesController).toBeDefined;
        });

        it('loadData should be created successfully', function () {
            agentData.isSuperUser = false;
            spyOn(policiesService, 'loadData').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            [
                                    { packageName: "AirCare", subTitle: null, packageId: '1' },
                                    { packageName: "AirCare", subTitle: "Abroad", packageId: '3' },
                                    { packageName: "ExactCare Family", subTitle: null, packageId: '4' }
                            ]
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            expect(upcomingPoliciesController.loadData()).toBeDefined;
        });

        it('reloadData should be created successfully', function () {
            agentData.isSuperUser = false;
            upcomingPoliciesController.reloadData();
            expect(upcomingPoliciesController.reloadDataFlag).toBe(true);
        });

        it('refreshData should be created successfully', function () {
            agentData.isSuperUser = false;
            upcomingPoliciesController.refreshData();
            expect(upcomingPoliciesController.refreshDataFlag).toBe(true);
        });

        it('cancelPolicy with ids should be created successfully', function () {
            spyOn(policiesService, 'confirmCancelPolicy').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            {

                            }
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            expect(upcomingPoliciesController.cancelPolicy({ policyNumber: '1212' })).toBeDefined;
        });
    });

    describe('upcomingPoliciesController init tests for super user', function () {
        agentData.isSuperUser = true;
        dateRangeValue = { startDate: null, endDate : null};

        it('should be created successfully', function () {
            expect(upcomingPoliciesController).toBeDefined;
        });

        it('loadData for super user should be created successfully', function () {
            agentData.isSuperUser = true;
            dateRangeValue = { startDate: null, endDate: null };
            spyOn(policiesService, 'loadPagedData').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback(
                            {
                                totalRecords: 3,
                                policies: [
                                    { packageName: "AirCare", subTitle: null, packageId: '1' },
                                    { packageName: "AirCare", subTitle: "Abroad", packageId: '3' },
                                    { packageName: "ExactCare Family", subTitle: null, packageId: '4' }
                                ]
                            }
                        ), errorcallback({ error: "error" })
                    }
                };
            });
            upcomingPoliciesController.loadData();
            expect(upcomingPoliciesController.gridConfig.totalRecords).toBeDefined;
        });
    });
});
