/* jshint -W117, -W030 */
describe('productTableService', function () {
    beforeEach(module('agentPortal'));

    var productTableService;

    beforeEach(inject(function (_productTableService_) {
        productTableService = _productTableService_;
    }));

    describe('refining package data', function () {
        var pkgStart;
        var coveragesStart;
        var coverageMap;
        var pkgEnd;
        var coveragesEnd;

        beforeEach(function () {
            pkgStart = mockData.getMockExactcarePackage();

            coveragesStart = mockData.getMockCoverages();

            coverageMap = mockData.getMockCoverageMap();
        });

        it('coverages should match the mocked coverageMap output', function () {
            var returnedData = productTableService.refinePackageData(pkgStart, coveragesStart, null);
            var matchesCoverageMap = true;
            for (var key in returnedData.coverages) {
                if (coverageMap.hasOwnProperty(key) === false) {
                    matchesCoverageMap = false;
                }
            }
            expect(matchesCoverageMap).toEqual(true);
        });

        it('should have 2 where type is upgrade and hasUpgrade is true', function () {
            var returnedData = productTableService.refinePackageData(pkgStart, coveragesStart, null);
            var count = 0;
            for (var key in returnedData.coverages) {
                if (returnedData.coverages[key].hasUpgrade === true && returnedData.coverages[key].type.toLowerCase() === 'upgrade') {
                    count++;
                }
            }

            // adjusted to compensate for hard coded coverages
            expect(count).toEqual(2);
        });

        it('should have 3 where type is not upgrade and hasUpgrade is true', function () {
            var returnedData = productTableService.refinePackageData(pkgStart, coveragesStart, null);
            var count = 0;
            for (var key in returnedData.coverages) {
                if (returnedData.coverages[key].hasUpgrade === true && returnedData.coverages[key].type.toLowerCase() !== 'upgrade') {
                    count++;
                }
            }

            // adjusted to compensate for hard coded coverages
            expect(count).toEqual(3);
        });
    });
});
