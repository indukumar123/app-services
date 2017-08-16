/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
global_client_cache_refresh_minutes = 5;
dataLayer = {};

describe('policyUploadDetailsController', function () {
    beforeEach(module('agentPortal'));

    var policyUploadDetailsController;
    var nonMerchantPolicies;
    var format;
    var $q;
    var controller;
    var root;
    var scope;
    var stateParams;
    var format;
    var window;
    var $stateParams;
    var dataservice;

    function initController() {
        policyUploadDetailsController = controller('policyUploadDetailsController', {
            $q: $q,
            $scope: root.$new(),
            nonMerchantPolicies: nonMerchantPolicies,
            format: format,
            $stateParams: $stateParams,
            $window: window
        });

        root.$apply();
    }

    beforeEach(inject(function (_$q_, _nonMerchantPolicies_, _dataservice_, _format_, _$window_, _$stateParams_) {
        $q = _$q_;
        nonMerchantPolicies = _nonMerchantPolicies_;
        dataservice = _dataservice_;
        format = _format_;
        window = _$window_;
        $stateParams = _$stateParams_;

    }));
  
  beforeEach(inject(function ($controller, _$rootScope_, _$q_, _intentService_, _nonMerchantPolicies_, _format_, _$window_) {
        $q = _$q_;
        controller = $controller;
        root = _$rootScope_;
        nonMerchantPolicies = _nonMerchantPolicies_;
        format = _format_;
        $scope = _$rootScope_;
        window = _$window_;
        window.dataLayer = {};

        // Initial details for the pagination
        $scope.paginationDetails = {
            maxSize: 0,
            itemsPerPage: 10,
            model: 1,
            totalItems: 0
        };
        $scope.errorsOnly = false;
        $scope.errorInformation = {};
        $scope.showErrorInfo = false;
        $scope.scrollDisabled = false;
        $scope.minRows = 5;
        $scope.columnDisplayText = 'Show all columns';
        $scope.allColumns = false;
        $scope.sortGridBy = [{ header: "CSV Row Number", binding: "csvRowNumber", addToSort: true, sortDesc: false, alwaysShow: true }];

        agentSpy = spyOn(nonMerchantPolicies, 'getPolicyPaginationDetail').and.callFake(
             function () {
                 return {
                     then: function (callback) {
                         callback(
                             {
                                 pagedItems:
                                   [{ agencyCode: "T0005", fileWriteDateTimeUTC: "2015-12-01T05:37:00", lineItems: null, mD5Hash: "0330A427C91918C89E42C7F9E818C289", uploadDateTimeUTC: "2015-12-01T05:37:00", totalUniqueRows: 1 }],
                                 
                             })
                     }
                 };
             });

        agentSpy = spyOn(nonMerchantPolicies, 'getPolicyDetails').and.callFake(
              function () {
                  return {
                      then: function (callback) {
                          callback(
                              {
                                  result: {}

                              })
                      }
                  };
              });

       initController();
       
    }));

    describe('policyUploadDetailsController init tests', function () {
        it('should be created successfully', function () {
            expect(policyUploadDetailsController).toBeDefined;
        });

        it('verify downloadPolicies', function () {
            expect(policyUploadDetailsController.downloadPolicies()).toBeDefined;
        });

        it('verify paginationChanged', function () {
            expect(policyUploadDetailsController.paginationChanged()).toBeDefined;
        });

        it('verify changeGridSortBindings', function () {
            policyUploadDetailsController.column = { addToSort : true};
            expect(policyUploadDetailsController.changeGridSortBindings(policyUploadDetailsController.column)).toBeDefined;
        });

        it('verify toggleDesc', function () {
            policyUploadDetailsController.column = { sortDesc: true };
            expect(policyUploadDetailsController.toggleDesc(policyUploadDetailsController.column)).toBeDefined;
        });

        it('verify showErrorInformation', function () {
            policyUploadDetailsController.line = { policyUploadErrorTypeId: 1 };
            expect(policyUploadDetailsController.showErrorInformation(policyUploadDetailsController.line)).toBeDefined;
        });

        it('verify showErrorInformation set policyUploadErrorTypeId to false', function () {
            policyUploadDetailsController.line = { policyUploadErrorTypeId: false };
            expect(policyUploadDetailsController.showErrorInformation(policyUploadDetailsController.line)).toBeDefined;
        });

        it('verify toggleErrors', function () {
            policyUploadDetailsController.errorsOnly = true;
            expect(policyUploadDetailsController.toggleErrors()).toBeDefined;
        });

        it('verify hideErrorInfo', function () {
            policyUploadDetailsController.showErrorInfo = false;
            expect(policyUploadDetailsController.hideErrorInfo()).toBeDefined;
        });

        it('verify columnDisplay', function () {
            policyUploadDetailsController.allColumns = true;
            expect(policyUploadDetailsController.columnDisplay()).toBeDefined;
        });

        it('verify columnDisplay set allColumns to false', function () {
            policyUploadDetailsController.allColumns = false;
            expect(policyUploadDetailsController.columnDisplay()).toBeDefined;
        });

        it('verify showColumnHeader', function () {
            policyUploadDetailsController.column = { alwaysShow: true };
            policyUploadDetailsController.allColumns = true;
            expect(policyUploadDetailsController.showColumnHeader(policyUploadDetailsController.column)).toBeDefined;
        });

        it('verify showColumnHeader set column always to false', function () {
            policyUploadDetailsController.column = { alwaysShow: false, allColumns: true };
            expect(policyUploadDetailsController.showColumnHeader(policyUploadDetailsController.column)).toBeDefined;
        });

        it('verify showColumnData', function () {
            policyUploadDetailsController.allColumns = true;
            expect(policyUploadDetailsController.showColumnData('agentCode')).toBeDefined;
        });

        it('verify showColumnData set allColumns to false', function () {
            policyUploadDetailsController.allColumns = false;
            expect(policyUploadDetailsController.showColumnData('agentCode')).toBeDefined;
        });

    });
})