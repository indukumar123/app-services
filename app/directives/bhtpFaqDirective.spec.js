/* jshint -W117, -W030 */
describe('bhtpFaqDirective', function () {
    beforeEach(module('agentPortal'));
    var parse;
    var stateParams;
    var compile;
    var httpBackend;
    var httpFlush;
    var faqService;
    var element;
    var getPackageFaqUri = "/APIProxy/faq/packages";
    var getAgentsFaqsUri = "/APIProxy/faq/agents";
    var getConsumerFaqsUri = "/APIProxy/faq/consumer";

    describe('directive on products page', function () {
        beforeEach(inject(function (_$parse_, _$stateParams_, _$compile_, _$rootScope_, _$httpBackend_, _faqService_, $q) {
            parse = _$parse_;
            stateParams = _$stateParams_;
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            httpBackend = _$httpBackend_;
            faqService = _faqService_;
            httpBackend.when('GET', getPackageFaqUri).respond(200, mockData.getMultipleUnparsedPackages());
            httpBackend.when('GET', getAgentsFaqsUri).respond(200, mockData.getMockPackages());
            httpBackend.when('GET', getConsumerFaqsUri).respond(200, mockData.getMockPackages());
            httpFlush = httpBackend.flush;

            spyOn(faqService, 'getFaqsByPackageRatingIds').and.returnValue($q.when(mockData.getMultiplePackageFaqs()));
            spyOn(faqService, 'getGenralFaqsForConsumers').and.returnValue($q.when(mockData.getConsumerFaqs()));

            // Directive and Controller Creation
            element = angular.element('<bhtp-faq-directive packages="" show-agent-faq="false" show-web-faq="true" display-on="false"></bhtp-faq-directive>');
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('bhtpFaqDirective');
        }));


        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('controller should be created', function () {
            expect(controller).toBeDefined();
        });

        it('controller title should be Faq & Help', function () {
            expect(controller.title).toEqual('FAQ & Help');
        });

        it('controller main header should be defined', function () {
            expect(controller.mainHeader).toBeDefined();
        });

        it('controller getFaqsByPackageRatingIds should be defined', function () {
            var packageIds = ["7", "2", "4", "3"];
            expect(controller.getFaqsByPackageRatingIds).toBeDefined();
        });

        it('controller group length should be 4', function () {
            var packageIds = ["7", "2", "4"];
            controller.getFaqsByPackageRatingIds(packageIds);
            rootScope.$digest();
            // 4 Because we also get the Consumer Faqs on the init
            expect(controller.groups.length).toEqual(4);
        });

        it('controller hasFaqs should be true', function () {
            var packageIds = ["7", "2", "4"];
            controller.getFaqsByPackageRatingIds(packageIds);
            rootScope.$digest();
            expect(controller.hasFaqs).toEqual(true);
        });

        it('controller showWebFaq should be equal to string true', function () {
            expect(controller.showWebFaq).toEqual('true');
        });

        it('controller showAgentFaq should be equal to string false', function () {
            expect(controller.showAgentFaq).toEqual('false');
        });
    });

    describe('directive on faq page', function () {
        beforeEach(inject(function (_$parse_, _$stateParams_, _$compile_, _$rootScope_, _$httpBackend_, _faqService_, $q) {
            parse = _$parse_;
            stateParams = _$stateParams_;
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            httpBackend = _$httpBackend_;
            faqService = _faqService_;
            httpBackend.when('GET', getPackageFaqUri).respond(200, mockData.getMultipleUnparsedPackages());
            httpBackend.when('GET', getAgentsFaqsUri).respond(200, mockData.getMockPackages());
            httpBackend.when('GET', getConsumerFaqsUri).respond(200, mockData.getMockPackages());
            httpFlush = httpBackend.flush;

            spyOn(faqService, 'getFaqsByPackageRatingIds').and.returnValue($q.when(mockData.getNoPackageFaqs()));
            spyOn(faqService, 'getGenralFaqsForAgents').and.returnValue($q.when(mockData.getAgentFaqs()));

            // Directive and Controller Creation
            element = angular.element('<bhtp-faq-directive packages="" show-agent-faq="true" show-web-faq="false" display-on="true"></bhtp-faq-directive>');
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('bhtpFaqDirective');
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('controller should be created', function () {
            expect(controller).toBeDefined();
        });

        it('controller title should be Faq & Help', function () {
            expect(controller.title).toEqual('FAQ & Help');
        });

        it('controller main header should be defined', function () {
            expect(controller.mainHeader).toBeDefined();
        });

        it('controller group length should be 4', function () {
            // 1 Because we only get Agency Faqs
            expect(controller.groups.length).toEqual(1);
        });

        it('controller hasFaqs should be false', function () {
            var packageIds = ["55"];
            controller.getFaqsByPackageRatingIds(packageIds);
            rootScope.$digest();
            expect(controller.hasFaqs).toEqual(false);
        });
    });
});
