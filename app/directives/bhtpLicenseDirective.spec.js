describe('bhtpLicenseDirective', function () {
    beforeEach(module('agentPortal'));

    var stateParams;
    var compile;
    var rootScope;
    var httpBackend;
    var licenseService;
    var utilService;
    var portalService;
    var sessionStorage;
    var agents;
    var controller;

    describe('directive on exactcare page', function () {
        beforeEach(inject(function (_$stateParams_, _$compile_, _$rootScope_, _$httpBackend_, _licenseService_, $q, _utilService_, _portalService_, _$sessionStorage_, _agents_) {
            stateParams = _$stateParams_;
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            httpBackend = _$httpBackend_;
            licenseService = _licenseService_;
            utilService = _utilService_;
            portalService = _portalService_;
            sessionStorage = _$sessionStorage_;
            agents = _agents_;
            /*
            httpBackend.when('GET', getPackageFaqUri).respond(200, mockData.getMultipleUnparsedPackages());
            httpBackend.when('GET', getAgentsFaqsUri).respond(200, mockData.getMockPackages());
            httpBackend.when('GET', getConsumerFaqsUri).respond(200, mockData.getMockPackages());
            httpFlush = httpBackend.flush;

            spyOn(faqService, 'getFaqsByPackageRatingIds').and.returnValue($q.when(mockData.getMultiplePackageFaqs()));
            spyOn(faqService, 'getGenralFaqsForConsumers').and.returnValue($q.when(mockData.getConsumerFaqs()));
            */
            spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', agentCode: 'A1234', isSuperUser: false, isAmbassador: false }));
            spyOn(portalService, 'loadStates').and.returnValue($q.when([{ name: 'Wisconsin', code: 'WI' }, { name: 'Atlanta', code: 'AT' }]));

            // Directive and Controller Creation
            element = angular.element('<bhtp-license-directive warning="" state="WI" package-id="2" show-warning="vm.state.showWarning" can-continue="vm.canContinue" show-cached="false" package-name="AirCare"></bhtp-license-directive>');
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('bhtpLicenseDirective');
            controller.state = "WI";
            controller.currentAgent = { agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false };
            controller.states = [{ name: 'Wisconsin', code: 'WI' }, { name: 'Atlanta', code: 'AT' }];
            
            controller.packageName = "package";
        }));

        it('controller should be created', function () {
            expect(controller).toBeDefined();
        });

        it(' checkLicense bhtp error', function () {
            spyOn(licenseService, 'canBhtpSell').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback(false), errorcallback({ error: "error" }) }
                };
            });
            spyOn(licenseService, 'getStateLicense').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ canSell: false }), errorcallback({ error: "error" }) }
                };
            });
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });

        it(' checkLicense agency no package name', function () {
            spyOn(licenseService, 'canBhtpSell').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback(true), errorcallback({ error: "error" }) }

                };
            });
            controller.packageName = null;
            spyOn(licenseService, 'getStateLicense').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ canSell: false }), errorcallback({ error: "error" }) }
                };
            });
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });

        it(' checkLicense agency license ok', function () {
            spyOn(licenseService, 'canBhtpSell').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback(true), errorcallback({ error: "error" }) }

                };
            });
            spyOn(licenseService, 'getStateLicense').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ canSell: true }), errorcallback({ error: "error" }) }
                };
            });
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });


        it(' checkLicense agency license failed Ambassador', function () {
            controller.currentAgent.isAmbassador = true;
            spyOn(licenseService, 'canBhtpSell').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback(true), errorcallback({ error: "error" }) }

                };
            });
            spyOn(licenseService, 'getStateLicense').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ canSell: false }), errorcallback({ error: "error" }) }
                };
            });
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });

        it(' checkLicense agency license failed non Ambassador', function () {
            spyOn(licenseService, 'canBhtpSell').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback(true), errorcallback({ error: "error" }) }

                };
            });
            spyOn(licenseService, 'getStateLicense').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ canSell: false }), errorcallback({ error: "error" }) }
                };
            });
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });

        it(' checkLicense agency license failed from cache', function () {
            controller.showCached = true;
            controller.checkLicense();
            expect(controller.canContinue).toBeDefined();
        });

        it(' checkLicense no current agent', function () {
            controller.currentAgent = null;
            controller.checkLicense();
            expect(controller.canContinue).toEqual(undefined);
        });

        it(' hidewarning', function () {
            controller.hidewarning();
            expect(controller.showWarning).toEqual(false);
        });
    });
});