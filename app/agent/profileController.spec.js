/* jshint -W117, -W030 */
dataLayer = {};

describe('profileController', function () {
    beforeEach(module('agentPortal'));

    var profileController;
    var portalService;
    var agentService;
    var settings;
    var $q;
    var controller;
    var root;
    var agentSpy;
    var $stateParams;
    var $scope;
    var event;
    var intentService;
    var modal;
    var $timeout;
    var $filter;   

    function initController() {
        profileController = controller('profileController', {
            $q: $q,
            $scope: root.$new(),
            portalService: portalService,
            agentService: agentService,
            settings: settings,
            $stateParams: $stateParams,
            $timeout: $timeout,
            $filter: $filter
        });

        root.$apply();
    }

    beforeEach(inject(function (_portalService_, _settings_, _agentService_, _$stateParams_, _$timeout_, _$filter_) {
        portalService = _portalService_;
        agentService = _agentService_;
        settings = _settings_;
        $stateParams = _$stateParams_;
        $timeout = _$timeout_;
        $filter = _$filter_;
    }));

    beforeEach(inject(function ($controller, _$rootScope_, _$q_, _intentService_, $compile, $timeout, $modal, utilService, $timeout, $filter) {
        $q = _$q_;
        controller = $controller;
        root = _$rootScope_;
        intentService = _intentService_;
        modal = $modal;
        $timeout = $timeout;
        $filter = $filter;

        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(agentService, 'getAgent').and.callFake(function () {
            return {
                $promise: {
                    then: function (callback, getAgentErrorCallback) { callback({ result: true }), getAgentErrorCallback({ error: "error" }) }
                },
            };
        });
        spyOn(agentService, 'getStates').and.returnValue([{}]);
        spyOn(intentService, 'setIntent').and.returnValue([{}]);
        spyOn(utilService, 'showPopup').and.returnValue([{}]);
        spyOn(agentService, 'saveAgent').and.callFake(function () {
            return {
                then: function (callback, errorcallback) { callback({ result: true }), errorcallback({ error: "error" }) }

            };
        });

        $scope = _$rootScope_;
        var element = angular.element(
             '<form name="agentAdddressForm">' +
             '</form>'
           );
        $compile(element)($scope);
        form = $scope.form;

        initController();

    }));

    describe('AgentDetailController init tests', function () {
        it('should be created successfully', function () {
            profileController.currentAgent = {};
            profileController.currentAgent.agentId = "AA1234";
            expect(profileController).toBeDefined;
        });

        it('should set phoneNumber to undefined', function () {
            profileController.updatedAgent = {};
            expect(profileController.updatedAgent.phoneNumber).toEqual(undefined);
        });

        it('should save profile', function () {
            profileController.agent.agentId = 'AA1234';
            profileController.updatedAgent = {};
            profileController.updatedAgent.firstName = 'firstname';
            expect(profileController.saveProfile()).toBeDefined;
        });

        it('should cancel edit profile', function () {
            expect(profileController.cancelEdit()).toBeDefined;
        });

        it('should edit profile', function () {
            expect(profileController.editProfile()).toBeDefined;
            $timeout.flush();
        });

        it('should edit password', function () {   
            expect(profileController.editPassword()).toBeDefined;
        });

        it('should filter phoneNumber', function () {
            profileController.updatedAgent = {};
            profileController.updatedAgent.phoneNumber = '5234432';
            result = $filter('phoneNumber')(profileController.updatedAgent.phoneNumber);
            expect(result).not.toBeNull();
        });

    });
});