/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('rootController', function () {
    beforeEach(module('agentPortal'));

    var rootController;
    var root;
    var portalService;
    var q;
    var auth;
    var storage;
    var controller;

    function initController() {
        rootController = controller('rootController', {
            $rootScope: root,
            $scope: root.$new(),
            portalService: portalService,
            auth: auth,
            storage: storage
        });

        root.$apply();
    }

    beforeEach(inject(function ($controller, $q, _portalService_, _auth_, _$rootScope_, _storage_) {
        spyOn(_portalService_, 'loadConfig').and.returnValue($q.when({ configVal: 'blah' }));

        portalService = _portalService_;
        root = _$rootScope_;
        q = $q;
        auth = _auth_;
        storage = _storage_;
        controller = $controller;

        initController();
    }));

    describe('RootController init tests', function () {
        it('should be created successfully', function () {
            expect(rootController).toBeDefined;
        });

        it('should have a config value', function () {
            expect(root.config).toBeDefined;
            expect(root.config.configVal).toEqual('blah');
        });

        it('should be ready after loading', function () {
            expect(rootController.ready).toEqual(true);
        });

        describe('RootController not logged in tests', function () {
            beforeEach(function () {
                spyOn(portalService, 'getCurrentAgentIsLoggedIn').and.returnValue(false);
                spyOn(portalService, 'getAgentIsInitialized').and.returnValue(false);
            });

            it('should not be logged in', function () {
                expect(rootController.isLoggedIn()).toEqual(false);
            });

            it('should be ready but not by checking the agent', function () {
                expect(rootController.isReady()).toEqual(true);
                expect(portalService.getAgentIsInitialized.calls.count()).toEqual(0);
            });
        });

        describe('RootController is logged in tests', function () {
            beforeEach(function () {
                spyOn(portalService, 'getCurrentAgentIsLoggedIn').and.returnValue(true);
                spyOn(portalService, 'getAgentIsInitialized').and.returnValue(true);
                spyOn(portalService, 'initializeAgent').and.returnValue(q.when({ agentCode: 'AA0123' }));

                sinon.stub(storage, 'get').returns({ test: 'test' });

                // reinitialize the controller to get the new stub
                initController();
            });

            it('should be logged in', function () {
                expect(rootController.isLoggedIn()).toEqual(true);
            });

            it('should be ready by checking the agent', function () {
                expect(rootController.isReady()).toEqual(true);
                expect(portalService.getAgentIsInitialized.calls.count()).toEqual(1);
            });

            it('should initialize the agent if already logged in', function () {
                expect(portalService.initializeAgent.calls.count()).toEqual(1);
            })
        });

        describe('RootController portalService proxy calls', function () {
            beforeEach(function () {
                spyOn(portalService, 'getCurrentAgentIsAmbassador').and.returnValue(true);
                spyOn(portalService, 'getCurrentAgent').and.returnValue(q.when({test: 'test'}));
            });

            it('is ambassador should be true', function () {
                expect(rootController.isAmbassador()).toEqual(true);
            });

            it('should call portal service get current agent', function () {
                rootController.getAgent().then(function (agent) {
                    expect(agent).toNotEqual(agent);
                    expect(portalService.getCurrentAgent.calls.count()).toEqual(1);
                });
            });
        });
    });
});
