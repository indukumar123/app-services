
describe('agentService', function () {
    beforeEach(module('agentPortal'));

    var $q;
    var agentService;
    var portalService;

    beforeEach(inject(function (_portalService_, _$q_, _agentService_) {
        $q = _$q_;
        portalService = _portalService_;
        agentService = _agentService_;
    }));

    describe('saving an agent', function () {
        it('should not return anything if current agent is not a super user', function () {
            spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
            agentService.saveAgentDetail({}).then(function (result) {
                expect(result).not.toBeDefined();
            });
        });
    });
});
