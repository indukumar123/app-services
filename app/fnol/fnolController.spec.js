/* jshint -W117, -W030 */

dataLayer = {};

describe('fnolController', function () {
    beforeEach(module('agentPortal'));

    var fnolController;
    var $controller;
    var $rootScope;
    var $stateParams;
    var fnolService;

    // #region Tests

    beforeEach(inject(function (_$controller_, _$rootScope_, _$stateParams_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $stateParams = _$stateParams_;

        initController();
    }));

    describe('fnolController init tests', function () {

        it('should be created successfully', function () {
            expect(fnolController).toBeDefined();
        });

        it('should get a policy number from the $stateParams', function () {
            $stateParams = {policyNumber: 'policyNumber'};
            initController();
            expect(fnolController.policyNumber).toBeDefined();
        });

    });
    // #endregion

    // #region Helper Functions
    function initController() {
        fnolController = $controller('fnolController', {
            $stateParams: $stateParams,
        });

        $rootScope.$apply();
    }
});
