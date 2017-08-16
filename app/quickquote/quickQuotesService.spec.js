describe('quickQuotesService', function () {
    beforeEach(module('agentPortal'));

    var $q;
    var quickQuotesService;
    var portalService;
    var resource;
    var window;

    beforeEach(inject(function (_portalService_, _$q_, _quickQuotesService_, $resource, $window) {
        $q = _$q_;
        portalService = _portalService_;
        quickQuotesService = _quickQuotesService_;
        resource = $resource;
        window = $window;
    }));

    it('method getQuotes', function () {
        spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
        quickQuotesService.getQuotes({}).then(function (result) {
            expect(result.length).toEqual(2);
        });
    });
    it('method getAgencyPackages', function () {
        spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
        quickQuotesService.getAgencyPackages({}).then(function (result) {
            expect(result.length).toEqual(2);
        });
    });
    it('method getVMState', function () {
        expect(quickQuotesService.getVMState()).toDefined;
    });
    it('method setVMState', function () {
        expect(quickQuotesService.setVMState({})).toDefined;
    });
    it('method isVmState true', function () {
        expect(quickQuotesService.isVmState()).toDefined;
    });
    it('method isVmState false', function () {
        window.sessionStorage.getItem = function () {
            true;
        }
        expect(quickQuotesService.isVmState()).toDefined;
    });
    it('method getPackageConfiguration', function () {
        quickQuotesService.getPackageConfiguration("1", "WI").then(function (result) {
            expect(result.length).toEqual(2);
        });
    });
});
