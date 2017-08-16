/* jshint -W117, -W030 */
describe('eligibilityService', function () {

    var packageConfiguration = mockData.getPackageConfigurationById();
    var allPackageConfigurations = mockData.getAllPackageConfigurations();
    var packageStateConfiguration = mockData.getPackageStateConfiguration();
    var PackageStateConfigurationNoState = mockData.getPackageStateConfigurationNoState();

    var packageConfigurationForRatingIdUrl = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration/1?cache=true';
    var allPackageConfigurationsUrl = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration?cache=true';
    var packageStateConfigurationUrl = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration/1/State?cache=true';
    var packageStateConfigurationWithStateUrl = '/APIProxyV2/BHTP/clients/v1/PackageConfiguration/1/State/WI?cache=true';

    beforeEach(module('agentPortal'));

    var $httpBackend;
    var $httpFlush;
    var eligibilityService;

    beforeEach(inject(function (_$httpBackend_, _eligibilityService_) {
        $httpBackend = _$httpBackend_;
        eligibilityService = _eligibilityService_;
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    it('should be created successfully', function () {
        expect(eligibilityService).toBeDefined();
    });

    describe('getPackageConfigurationByRatingId', function () {
        beforeEach(function () {
            $httpBackend.when('GET', packageConfigurationForRatingIdUrl).respond(200, packageConfiguration);
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(eligibilityService.getPackageConfigurationByRatingId).toBeDefined();
        });

        it('should return package configuration with id of 2', function () {
            var resp = eligibilityService.getPackageConfigurationByRatingId(1).then(function (data) {
                expect(data.response.id).toBeDefined();
                expect(data.response.id).toEqual(2);
            });
            $httpFlush();
        });
    });

    describe('getAllPackageConfigurations', function () {
        beforeEach(function () {
            $httpBackend.when('GET', allPackageConfigurationsUrl).respond(200, allPackageConfigurations);
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(eligibilityService.getAllPackageConfigurations).toBeDefined();
        });

        it('should return all package configurations', function () {
            var resp = eligibilityService.getAllPackageConfigurations().then(function (data) {
                expect(data.response.length).toEqual(2);
            });
            $httpFlush();
        });
    });

    describe('getPackageStateConfiguration', function () {
        beforeEach(function () {
            $httpBackend.when('GET', packageStateConfigurationWithStateUrl).respond(200, packageStateConfiguration);
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(eligibilityService.getPackageStateConfiguration).toBeDefined();
        });

        it('should return package state configuration for WI with rating id of 1', function () {
            var resp = eligibilityService.getPackageStateConfiguration("WI", 1).then(function (data) {
                console.log(data);
                expect(data.packageRatingId).toEqual("1");
            });
            $httpFlush();
        });
    });

    describe('getPackageStateConfiguration No State', function () {
        beforeEach(function () {
            $httpBackend.when('GET', packageStateConfigurationUrl).respond(200, PackageStateConfigurationNoState);
            $httpFlush = $httpBackend.flush;
        });

        it('should be defined', function () {
            expect(eligibilityService.getPackageStateConfiguration).toBeDefined();
        });

        it('should return package state configuration with not state but rating id of 1', function () {
            var resp = eligibilityService.getPackageStateConfiguration(null, 1).then(function (data) {
                expect(data.packageRatingId).toEqual("1");
                expect(data.stateIso2Code).toEqual(null);
            });
            $httpFlush();
        });
    });
    
});