describe('products Tiles', function () {
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
    var $state;
    var purchaseNavigationService;
    var fakeDeparture = new Date();
    var staticHtml = '<product-tiles packages="vm.packages" cta="vm.state.cta" customer-id="vm.state.customerId"></product-tiles>'

    describe(' directive', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_, _agents_, _purchaseNavigationService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService =_utilService_;
            portalService =_portalService_;
            scope = _$rootScope_.$new();
            agents = _agents_;
            // Directive and Controller Creation
            purchaseNavigationService = _purchaseNavigationService_;

            fakeDeparture = new Date();
            fakeDeparture.setHours(0, 0, 0, 0);

            spyOn(purchaseNavigationService, 'navigateToPurchase');

            spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'AA1234', agencyId: 'A1234', isSuperUser: false }));
            spyOn(portalService, 'loadPackagesForAgentByState').and.returnValue($q.when({ states: [{ name: 'WI' }] }));
            spyOn(portalService, 'loadProductsAndPackages').and.returnValue($q.when({ packages: [{ name: 'AirCare' }] }));
            spyOn(portalService, 'getInternalAgentAuthId').and.returnValue(null);

            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('productTiles');
        }));

        it(' should be created with packages', function () {
            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];
            expect(controller).toBeDefined();
        });

        it(' buy package without cta', function () {
            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];

            controller.buyPackage({ coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' })
            expect(purchaseNavigationService.navigateToPurchase).toHaveBeenCalled();
        });

        it(' buy package', function () {
            controller.cta = {
                additionalInfo: { residenceState: null },
                primaryTraveler: { dateOfBirth: null, tripCost : null},
                additionalTravelers: [{ dateOfBirth: null, tripCost: null }],
                policy: { departureDate: null, returnDate: null, destinationCountry: null }
            };

            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];

            controller.buyPackage({ coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' })
            expect(purchaseNavigationService.navigateToPurchase).toHaveBeenCalled();
        });

        it(' buy package with customer with destination', function () {
            controller.customerId = "1";
            controller.cta = {
                additionalInfo: { residenceState: null },
                primaryTraveler: { dateOfBirth: null, tripCost: null },
                additionalTravelers: [{ dateOfBirth: null, tripCost: null }],
                policy: { departureDate: null, returnDate: null, destinationCountry: null },
                destination: {
                    country : null
                }
            };

            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];

            controller.buyPackage({ coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' })
            expect(purchaseNavigationService.navigateToPurchase).toHaveBeenCalled();
        });

        it(' buy package with customer', function () {
            controller.customerId = "1";
            controller.cta = {
                additionalInfo: { residenceState: null },
                primaryTraveler: { dateOfBirth: null, tripCost: null },
                additionalTravelers: [{ dateOfBirth: null, tripCost: null }],
                policy: { departureDate: null, returnDate: null, destinationCountry: null },
                destination: {
                    country: {
                        isoCode2 : null
                    }
                }
            };

            rootScope.packages = [
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '2', id: "2", name: 'ExactCare maximumAge' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '7', id: "7", name: 'Aircare exemptCountries' },
                { coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' }
            ];

            controller.buyPackage({ coverages: [{ ratingId: 'FA' }, { ratingId: 'FA1' }], ratingId: '12', id: "12", name: 'Aircare No Package' })
            expect(purchaseNavigationService.navigateToPurchase).toHaveBeenCalled();
        });
    });

});