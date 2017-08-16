/* jshint -W117, -W030 */
describe('claimConfiguration', function () {
    beforeEach(module('agentPortal'));
    var fnolService;
    var policiesService;
    var compile;
    var $state;

    //var $modal;
    var element;
    var fakeModal;
    var $q;
    var getClaimConfigurationUri = "APIProxy/Agents/claimConfiguration/";
    var submitFnolForClaimUri = "APIProxy/Agents/submitfnol/";
    var getFraudWarningUri = "APIProxy/websitecontent/fraudwarning/2";
    var getPolicyByIdUri = "/APIProxy/agents/";
    var getCountryUri = 'proxy/bhtp/api/eligibility/country';
    var stateEligibilityUri = 'proxy/bhtp/api/eligibility/state';

    describe('claimConfiguration directive', function () {
        beforeEach(inject(function (_$rootScope_, _$httpBackend_, _fnolService_, _$q_, _$compile_, _policiesService_, _$state_) {
            rootScope = _$rootScope_.$new();
            httpBackend = _$httpBackend_;
            fnolService = _fnolService_;
            compile = _$compile_;
            policiesService = _policiesService_;
            $state = _$state_;
            $q = _$q_;
            //$modal = _$modal_;

            fakeModal = {
                result: {
                    then: function (confirmCallback, cancelCallback) {
                        //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
                        this.confirmCallBack = confirmCallback;
                        this.cancelCallback = cancelCallback;
                    }
                },
                close: function (item) {
                    //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
                    this.result.confirmCallBack(item);
                },
                dismiss: function (type) {
                    //The user clicked cancel on the modal dialog, call the stored cancel callback
                    this.result.cancelCallback(type);
                }
            };

            spyOn(fnolService, 'getClaimConfiguration').and.returnValue($q.when(mockData.getClaimConfiguration()));
            spyOn(fnolService, 'getFraudWarning').and.returnValue($q.when(mockData.getFraudWarning()));
            spyOn(fnolService, 'submitFnolForClaim').and.returnValue($q.when(mockData.submitFnolForClaimResponse()));
            spyOn(policiesService, 'getById').and.returnValue($q.when(mockData.getPolicyForFnol()));

            // Directive and Controller Creation
            element = angular.element('<claim-configuration policy-number="vm.policyNumber"></claim-configuration>');
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('claimConfiguration');
        }));

        it('controller should be created', function () {
            expect(controller).toBeDefined();
        });

        it('controller minCoverageGroup should be defined', function () {
            expect(controller.minCoverageGroup).toBeDefined();
        });

        it('controller errorDetails should be defined', function () {
            expect(controller.errorDetails).toBeDefined();
        });

        it('controller datePickers should be defined', function () {
            expect(controller.datePickers).toBeDefined();
        });

        it('controller claimConfig should be defined', function () {
            expect(controller.claimConfig).toBeDefined();
        });

        it('controller customerId should be defined', function () {
            expect(controller.customerId).toBeDefined();
        });

        it('controller packageName should be defined', function () {
            expect(controller.packageName).toBeDefined();
        });

        it('controller minDate should be defined', function () {
            expect(controller.datePickers.dateOfLoss.minDate).toBeDefined();
        });

        it('controller maxDate should be defined', function () {
            expect(controller.datePickers.dateOfLoss.maxDate).toBeDefined();
        });

        it('controller travelerRequired should be defined', function () {
            expect(controller.travelerRequired).toBeDefined();
        });

        it('controller setDateOfLoss should be defined', function () {
            expect(controller.setDateOfLoss).toBeDefined();
        });

        it('it should direct to policyDetails on cancel', function () {
            spyOn($state, 'go').and.callThrough();
            controller.policyNumber = '123456789';
            controller.cancelFnol();
            expect($state.go).toHaveBeenCalledWith('policiesView', { policyNumber: '123456789' });
        });

        it('stateProvinceOfLoss and cityOfLoss should be null if country changes', function () {
            controller.fnol = mockData.getECFnolSubmissionUnformatted();
            controller.onCountryChanged();
            expect(controller.fnol.cityOfLoss).toEqual(null);
            expect(controller.fnol.stateProvinceOfLoss).toEqual(null);
        });

        it('loadLocations should format flights', function () {
            controller.fnol = mockData.getECFnolSubmissionUnformatted();
            controller.fnol.flight = mockData.getFlightsForLocationFormatDisplay().flightId;
            controller.claimConfig.flights = mockData.getFlightsForLocationFormatDisplay().flights;
            controller.loadLocations();
            expect(controller.locationOptions.length).toEqual(2);
        });

    });
});
