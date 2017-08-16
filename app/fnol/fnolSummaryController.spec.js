/* jshint -W117, -W030 */

dataLayer = {};

describe('fnolSummaryController', function () {
    beforeEach(module('agentPortal'));

    var fnolSummaryController;
    var $controller;
    var $rootScope;
    var $state;
    var fnolService;

    // #region Tests

    beforeEach(inject(function (_$controller_, _$rootScope_, _$state_, _fnolService_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $state = _$state_;
        fnolService = _fnolService_;

        initController();
    }));

    describe('fnolSummaryController init tests', function () {

        it('should be created successfully', function () {
            expect(fnolSummaryController).toBeDefined();
        });

        it('should redirect to the dashboard if there is no current claim', function () {
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(null);
            spyOn($state, 'go').and.callThrough();
            initController();
            expect($state.go).toHaveBeenCalledWith('dashboard');
        });

        it('should have a view model claim if the service returns one', function () {
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(mockData.getSubmitFNOLResponse());
            initController();
            expect(fnolSummaryController.claim.claimFeatureNumber).toEqual(mockData.getSubmitFNOLResponse().claimFeatureNumber);
        });

        it('should comma separate the affected travelers', function () {
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(mockData.getSubmitFNOLResponse());
            initController();
            expect(fnolSummaryController.claim.displayTravelerList).toEqual('Erin Rasmussen, Valerie Ninneman');
        });

        it('should not have a displayTravelerList value if claimed travelers are null', function () {
            var claim = mockData.getSubmitFNOLResponse();
            claim.claimedTravelers = null;
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(claim);
            initController();
            expect(fnolSummaryController.claim.displayTravelerList).not.toBeDefined();
        });

        it('should not have a displayDepartureDate value if the flight is null null', function () {
            var claim = mockData.getSubmitFNOLResponse();
            claim.flight = null;
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(claim);
            initController();
            expect(fnolSummaryController.claim.flight).toBeNull();
        });

        it('should not have a displayDateTimeOfLoss value if the dateTimeOfLoss is null null', function () {
            var claim = mockData.getSubmitFNOLResponse();
            claim.dateTimeOfLoss = null;
            spyOn(fnolService, 'getCurrentClaim').and.returnValue(claim);
            initController();
            expect(fnolSummaryController.claim.displayDateTimeOfLoss).not.toBeDefined();
        });
    });
    // #endregion

    // #region Helper Functions
    function initController() {
        fnolSummaryController = $controller('fnolSummaryController', {
            $state: $state,
            fnolService: fnolService
        });

        $rootScope.$apply();
    }
});
