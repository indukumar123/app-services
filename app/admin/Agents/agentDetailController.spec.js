/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('agentDetailsController', function () {
    beforeEach(module('agentPortal'));

    var agentDetailController;
    var portalService;
    var policiesService;
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

    function initController() {
        agentDetailController = controller('agentDetailController', {
            $q: $q,
            $scope: root.$new(),
            portalService: portalService,
            policiesService: policiesService,
            agentService: agentService,
            settings: settings,
            $stateParams: $stateParams
        });

        root.$apply();
    }

    beforeEach(inject(function (_policiesService_, _portalService_, _settings_, _agentService_, _$stateParams_) {
        portalService = _portalService_;
        policiesService = _policiesService_;
        agentService = _agentService_;
        settings = _settings_;
        $stateParams = _$stateParams_;
    }));

    beforeEach(inject(function ($controller, _$rootScope_, _$q_, _intentService_, $compile) {
        $q = _$q_;
        controller = $controller;
        root = _$rootScope_;
        intentService = _intentService_;


        agentSpy = spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
        spyOn(portalService, 'loadDRPAgentForAgency').and.returnValue($q.when({ result: '1234123435234' }));
        spyOn(agentService, 'getStates').and.returnValue([{}]);
        spyOn(agentService, 'getAgentDetail').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234' }));
        spyOn(agentService, 'activateAgent').and.returnValue($q.when({ result: true }));
        spyOn(agentService, 'expireAgent').and.returnValue($q.when({ result: true }));
        spyOn(agentService, 'saveAgentDetail').and.returnValue($q.when({ result: true }));
        spyOn(portalService, 'VerifyPostalCodeWithState').and.returnValue($q.when({ result: true }));
        spyOn(intentService, 'setIntent').and.returnValue([{}]);

        event = {
            preventDefault: function () {
                return true;
            },
            stopPropagation: function () {
                return null;
            }
        };

        $scope = _$rootScope_;
        var element = angular.element(
             '<form name="agentForm">' +
             '<input ng-model="otherAddressPostalCode" name="otherAddressPostalCode" />' +
             '</form>'
           );
        $scope.model = { otherAddressPostalCode: null }
        $compile(element)($scope);
        form = $scope.form;

        initController();

    }));

    describe('AgentDetailController init tests', function () {
        it('should be created successfully', function () {
            expect(agentDetailController).toBeDefined;
        });

        it('should be in edit mode without an agent id passed in', function () {
            expect(agentDetailController.editMode).toEqual(true);
        });

        it('should load states during the init', function () {
            expect(agentDetailController.lookup.length).toEqual(1);
        });

        it('should have a current logged in agent', function () {
            expect(agentDetailController.currentAgent.agentId).toEqual('BB1234');
        });

        it('should load an agent when an agent id is passed in', function () {
            $stateParams.agentId = '24523452435231';
            initController();
            expect(agentDetailController.agent.agentId).toEqual('AA1234');
        });

        it('should activate agent', function () {
            agentDetailController.modalTitle = 'Reactivate Agent';
            agentDetailController.yesButtonText = "Yes";
            agentDetailController.noButtonText = "No";
            agentDetailController.expireAgentMessage = "Are you sure you want to reactivate test user? This will allow them to log in and sell policies.";
            expect(agentDetailController.activateAgent()).toBeDefined;
        });

        it('should confirm re-activate agent', function () {
            agentDetailController.agentId = 'AA1234';
            expect(agentDetailController.confirmReactivateAgents()).toBeDefined;
        });

        it('should expire agent', function () {
            agentDetailController.modalTitle = "Expire Agent";
            agentDetailController.yesButtonText = "Yes";
            agentDetailController.noButtonText = "No";
            agentDetailController.expireAgentMessage = "Expiring an agent removes their ability to log in and sell policies. You can always undo this later. Are you sure you want to remove test user?";
            expect(agentDetailController.expireAgent()).toBeDefined;
        });

        it('should confirm expire agent', function () {
            agentDetailController.agentId = 'AA1234';
            expect(agentDetailController.confirmExpireAgents()).toBeDefined;
        });

        it('should edit agent', function () {
            expect(agentDetailController.editAgent()).toBeDefined;
        });

        it('should add other address', function () {
            expect(agentDetailController.addOtherAddress()).toBeDefined;
        });

        it('should remove phone', function () {
            expect(agentDetailController.removePhone()).toBeDefined;
        });

        it('should set the page title to edit agent details', function () {
            agentDetailController.agentId = 'AA1234';
            agentDetailController.editMode = true
            expect(agentDetailController.pageTitle()).toBeDefined;
        });

        it('should set the page title to agent details', function () {
            agentDetailController.agentId = 'AA1234';
            agentDetailController.editMode = false
            expect(agentDetailController.pageTitle()).toBeDefined;
        });

        it('should set the page title to add agent', function () {
            agentDetailController.agentId = undefined;
            expect(agentDetailController.pageTitle()).toBeDefined;
        });

        it('should cancel edit agent', function () {
            agentDetailController.agentId = undefined;
            expect(agentDetailController.cancelEdit()).toBeDefined;
        });

        it('should go back', function () {
            expect(agentDetailController.goBack()).toBeDefined;
        });

        it('should open date picker', function () {
            expect(agentDetailController.openDatePicker(event, true)).toBeDefined;
        });

        it('should disable edit if agent id is undefined', function () {
            agentDetailController.agent.agentId = undefined;
            expect(agentDetailController.disableEdit()).toBeDefined;
        });

        it('should disable edit if drp agent id is equal to agent id', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.drpAgentID = 'AA1234';
            expect(agentDetailController.disableEdit()).toBeDefined;
        });

        it('should disable edit if agent id and drp agent id are not equal', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.drpAgentID = 'AA1235';
            expect(agentDetailController.disableEdit()).toBeDefined;
        });

        it('should disable action if agent id is undefined', function () {
            agentDetailController.agent.agentId = undefined;
            expect(agentDetailController.disableAction()).toBeDefined;
        });

        it('should disable action if drp agent id is equal to agent id', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.drpAgentID = 'AA1234';
            expect(agentDetailController.disableAction()).toBeDefined;
        });

        it('should disable action if agent id is equal to current agent id', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.currentAgent.agentId = 'AA1234';
            expect(agentDetailController.disableAction()).toBeDefined;
        });

        it('should disable action if agent id and drp agent id are not equal', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.drpAgentID = 'AA1235';
            expect(agentDetailController.disableAction()).toBeDefined;
        });

        it('should validate zip code', function () {
            expect(agentDetailController.validateZipCode(undefined, undefined)).toBeDefined;
        });

        it('should set validity zip code to false', function () {
            expect(agentDetailController.validateZipCode('aaaa', 'Wisconsin')).toBeDefined;
        });

        it('should set validity zip code to false', function () {
            expect(agentDetailController.validateZipCode('54484', 'Wisconsin')).toBeDefined;
        });

        it('should save agent detail', function () {
            agentDetailController.agent.agentId = 'AA1234';
            agentDetailController.updatedAgent = {};
            agentDetailController.updatedAgent.firstName = 'firstname';
            expect(agentDetailController.saveAgent()).toBeDefined;
        });
    });
});