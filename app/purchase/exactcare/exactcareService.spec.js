describe('exactCareService', function () {
    beforeEach(module('agentPortal'));

    var exactCareService;
    var $httpFlush;
    var $httpBackend;
    var quotes;
    var $q;
    var quotesSpy;
    var $rootScope;

    beforeEach(inject(function (_exactCareService_, _$httpBackend_, _$q_, _quotes_, _$rootScope_) {
        exactCareService = _exactCareService_;
        $httpBackend = _$httpBackend_;
        $q = _$q_;
        quotes = _quotes_;
        $rootScope = _$rootScope_;

        quotesSpy = spyOn(quotes, 'getSingleQuote').and.returnValue($q.when({ policy: { premium: 123.45 } }));
    }));

    describe('getting a quick quote with optional coverages', function () {
        it('should call quotes service and get a quote', function () {
            exactCareService.getQuickQuoteWithAllCoverages({}).then(function (result) {
                expect(result).toBeDefined;
                expect(result.policy.premium).toEqual(123.45);
            });
        });

        it('should map the package name passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.policy.packageName).toEqual(agentPortalQuote.packageName);
            });
        });

        it('should map the departure date passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.policy.departureDate).toEqual(agentPortalQuote.policy.departureDate);
            });
        });

        it('should map the departure date passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.policy.returnDate).toEqual(agentPortalQuote.policy.returnDate);
            });
        });

        it('should map the trip deposit date passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.policy.tripDepositDate).toEqual(agentPortalQuote.policy.depositDate);
            });
        });

        it('should map the destination country passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.policy.destinationCountry).toEqual(agentPortalQuote.policy.destination.country.isoCode2);
            });
        });

        it('should map the primary traveler passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.travelers[0].isPrimary).toEqual(true);
            });
        });

        it('should map the primary traveler state passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.travelers[0].address.stateOrProvince).toEqual(agentPortalQuote.policy.primary.address.stateOrProvince);
            });
        });

        it('should map the primary traveler trip cost passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.travelers[0].tripCost).toEqual(agentPortalQuote.policy.primary.tripCost);
            });
        });

        it('should map additional traveler trip cost passed in quote into the API model', function () {
            var agentPortalQuote = mockData.getExactCareBaseQuote();

            exactCareService.getQuickQuoteWithAllCoverages(agentPortalQuote).then(function (result) {
                var quote = quotes.getSingleQuote.calls.mostRecent().args[0];
                expect(quote.travelers[1].tripCost).toEqual(agentPortalQuote.policy.travelers[0].tripCost);
            });
        });

        afterEach(function () {
            $rootScope.$apply();
        });
    });
});
