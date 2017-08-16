describe('products Table', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var agents;
    var fakeDeparture = new Date();
    var staticHtml = '<products-table packages="{{vm.packages}}" quotes="{{vm.quotes}}" residence-state="WI" customer-id="1" suppress-warning="false"></products-table>'

    describe(' directive', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_, _agents_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService =_utilService_;
            portalService =_portalService_;
            scope = _$rootScope_.$new();
            agents = _agents_;
            // Directive and Controller Creation
            
            fakeDeparture = new Date();
            fakeDeparture.setHours(0, 0, 0, 0);

            spyOn(agents, 'getCurrentAgent').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) {
                        callback({ rewardPointName: "rewardPointName", rewardPointShortName: "rewardPointShortName" }
                        ), errorcallback({ error: "error" })
                    }
                };
            });

            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('productsTable');
        }));

        it(' should be created with packages', function () {
            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];
            controller.quotes = [];
            expect(controller).toBeDefined();
        });

        it(' should be created with quotes', function () {
            controller.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];
            controller.quotes = [
                { package: { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' }, destination: { country: {} }, policy: { departureDate: fakeDeparture, returnDate: moment(fakeDeparture).add(2, 'days'), destinationCountry: "US" }, travelers: [{ birthDate: '11/11/1980', tripCost: 20 }] },
                { package: { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' }, destination: { country: {} }, policy: { departureDate: fakeDeparture, returnDate: moment(fakeDeparture).add(2, 'days'), destinationCountry: "US" }, travelers: [{ birthDate: '11/11/1980', tripCost: 20 }] },
                { package: { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }, destination: { country: {} }, policy: { departureDate: fakeDeparture, returnDate: moment(fakeDeparture).add(2, 'days'), destinationCountry: "US" }, travelers: [{ birthDate: '11/11/1980', tripCost: 20 }] }
            ];
            expect(controller).toBeDefined();
        });
    });

});