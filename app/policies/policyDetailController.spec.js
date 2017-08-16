/* jshint -W117, -W030 */

global_auth0_domain = 'blah';
global_auth0_client_id = 'blah';
dataLayer = {};

describe('policyDetailsController', function () {
    beforeEach(module('agentPortal'));

    var root;
    var controller;
    var stateParams;
    var state;
    var modal;
    var policiesService;
    var lookupDataService;
    var utilService;
    var settings;
    var portalService;
    var format;
    var q;
    var window;
    var policyDetailsController;
    var spyGetById;

    // #region Tests

    beforeEach(inject(function ($controller, $rootScope, $stateParams, $state, $modal, _policiesService_, _lookupDataService_, _utilService_, _settings_, _portalService_, _format_, $q, $window) {
        root = $rootScope;
        controller = $controller;
        stateParams = $stateParams;
        state = $state;
        modal = $modal;
        policiesService = _policiesService_;
        lookupDataService = _lookupDataService_;
        utilService = _utilService_;
        settings = _settings_;
        portalService = _portalService_;
        q = $q;
        window = $window;

        // Setup controller data 
        stateParams.policyNumber = '100003195';
        root.config = { CLIENT_AIRCARE_RATING_IDS: '1;4' };
        spyOn(lookupDataService, 'getCountryByCode').and.returnValue(q.when({ name: 'United States' }));
        spyOn(portalService, 'loadProductsAndPackages').and.returnValue(q.when({}));
        spyOn(portalService, 'getAgentByInternalId').and.returnValue($q.when({ agentId: 'BB1234', agencyId: 'A1234', isSuperUser: false }));
    }));

    describe('policyDetailsController init tests', function () {
        beforeEach(function () {
            spyGetById = spyOn(policiesService, 'getById').and.returnValue(q.when(policyObject()));

            initController();
        });

        it('should be created successfully', function () {
            expect(policyDetailsController).toBeDefined;
        });

        it('title should contain policy number', function () {
            expect(policyDetailsController.title).toEqual('Policy ' + policyDetailsController.policyNumber);
        });

        it('policyDetailControllers policys policy number should equal the requests policy number', function () {
            expect(policyDetailsController.policyDetail.name).toEqual(policyDetailsController.policyNumber);
        });

        it('policyDocuments should be present', function () {
            expect(policyDetailsController.policyDetail.policyDocumentLink).toBeDefined;
        });

        it('Should show travelers is true', function () {
            expect(policyDetailsController.showTravelers()).toEqual(true);
        });

        it('Show flights is false', function () {
            expect(policyDetailsController.showFlights()).toEqual(false);
        });

        it('Show midsection is true', function () {
            expect(policyDetailsController.showMidSection()).toEqual(true);
        });

        it('Show tripCost is true', function () {
            expect(policyDetailsController.showTripCost()).toEqual(true);
        });

        it('Show cancel is true', function () {
            expect(policyDetailsController.policyDetail.canBeCancelled).toEqual(true);
        });

        it('Show edit is true', function () {
            expect(policyDetailsController.policyDetail.canBeEdited).toEqual(true);
        });

        it('PolicyError is undefined', function () {
            expect(policyDetailsController.policyError).toBe(undefined);
        });

        describe('policyDetailsController dont show tests', function () {
            beforeEach(function () {
                var modifiedPolicy = policyObject();
                modifiedPolicy.policy.policyDocumentLink = null;
                modifiedPolicy.policy.canBeCancelled = false;
                modifiedPolicy.policy.canBeEdited = false;

                spyGetById.and.returnValue(q.when(modifiedPolicy));

                initController();
            });

            it('should be created successfully', function () {
                expect(policyDetailsController).toBeDefined;
            });

            it('Policy error is Policy \"ALKJR\" you are searching for was not found.', function () {
                spyGetById.and.returnValue(q.reject(errorResponse()));

                initController();

                expect(policyDetailsController.policyError).toEqual('Policy \"ALKJR\" you are searching for was not found.');
            });

            it('Show cancel is false', function () {
                expect(policyDetailsController.policyDetail.canBeCancelled).toEqual(false);
            });

            it('Show edit is false', function () {
                expect(policyDetailsController.policyDetail.canBeEdited).toEqual(false);
            });

            it('policyDocuments should be missing', function () {
                expect(policyDetailsController.policyDetail.policyDocumentLink).toBe(null);
            });
        });

    });
    // #endregion

    // #region Helper Functions
    function initController() {
        policyDetailsController = controller('policyDetailController', {
            $q: q,
            $stateParams: stateParams,
            $state: state,
            $modal: modal,
            policiesService: policiesService,
            lookupDataService: lookupDataService,
            utilService: utilService,
            settings: settings,
            portalService: portalService,
            $window: window
        });

        root.$apply();
    }

    function policyObject() {
        return {
            "policy": {
                "name": "100003195",
                "submissionChannel": "Agent",
                "destination": null,
                "destinationCity": "Tokyo",
                "destinationState": null,
                "destinationCountry": "JPN",
                "departureDate": "2014-10-16T05:00:00Z",
                "returnDate": "2014-10-20T05:00:00Z",
                "tripDepositDate": null,
                "finalPaymentDate": null,
                "taxes": 0.00,
                "fees": null,
                "tripCost": 3000.00,
                "totalTripCostProvided": false,
                "agentName": "Scott Gerstl",
                "agentCode": "AA0114",
                "agentId": "003J0000014y2wXIAQ",
                "agencyCode": "BHTP",
                "agencyId": "001J000001THzC9IAL",
                "facilitatingAgent": null,
                "carRentalCompany": null,
                "rentalCarPickupDate": null,
                "rentalCarReturnDate": null,
                "cruiseLine": null,
                "tourOperator": null,
                "hotel": null,
                "rentalCompany": null,
                "airline": "Delta Air Lines",
                "hasInsuranceDisclaimer": false,
                "requestId": null,
                "id": "a1kJ0000000Kxr6IAC",
                "status": "Expired",
                "policyNumber": "100003195",
                "expirationDate": "2014-10-20T23:59:00Z",
                "expirationTimezone": "UTC/GMT",
                "localExpirationDate": "2014-10-20T23:59:00.000+00:00",
                "effectiveDate": "2014-10-16T00:01:00Z",
                "effectiveTimezone": "UTC/GMT",
                "localEffectiveDate": "2014-10-16T00:01:00.000+00:00",
                "lastTransactionQuoteId": "383885224",
                "packageRatingId": "2",
                "packageName": "ExactCare",
                "premium": 102.00,
                "preDepartureNoticeRefundDays": 0,
                "cancelEndDate": null,
                "canBeRefunded": false,
                "canBeEdited": true,
                "canBeCancelled": true,
                "canAddTravelers": false,
                "canRemoveTravelers": false,
                "canClaim": true,
                "policyDocumentLink": "https://test-docs.bhtp.com/dl-00dj0000003knkamac/a1k/a1kJ0000000tbKDIAY/a0rJ0000003EnktIAC/200037237%20-%202.pdf?AWSAccessKeyId=AKIAI5V653DF5C4Z57YA&Expires=1441823070&Signature=60Wv%2FctG3WaQ4Gz3v%2BVgCqhLTec%3D",
                "primaryTravelerName": "Scott Gerstl",
                "policyBuyerName": "Scott Gerstl",
                "purchaseDate": "2014-10-16T01:33:04Z",
                "hasPremiumChange": false,
                "localDepartureDate": "2014-10-16T05:00:00.000+00:00",
                "localReturnDate": "2014-10-20T05:00:00.000+00:00",
                "subTitle": null
            },
            "transactionRecords": {
                "payments": [
                    {
                        "transactionDate": "2014-10-16T01:32:16Z",
                        "amount": 104.00,
                        "success": false,
                        "failedReason": null,
                        "method": "CC",
                        "payeeName": null,
                        "transactionId": "aeeca3b0b88748598ad6a6cc2f66731e",
                        "billingAddress": null,
                        "refundedTransactionId": null
                    }
                ],
                "refunds": []
            },
            "transactions": null,
            "travelers": [
                {
                    "correlationId": null,
                    "firstName": "Scott",
                    "lastName": "Gerstl",
                    "suffix": null,
                    "birthDate": "1988-05-26",
                    "age": 26,
                    "gender": "Male",
                    "email": null,
                    "relationship": null,
                    "fee": 9.00,
                    "travelerAccount": "001J000001TjEg5IAF",
                    "isPrimary": true,
                    "tripCost": null,
                    "coverages": [
                        {
                            "id": "a1ZJ0000000fR8TMAU",
                            "coverageLimit": 10000.00,
                            "premium": 0.188406,
                            "ratingId": "AD",
                            "type": "Standard",
                            "percentageLimitofTripCost": null,
                            "dailyLimit": null,
                            "coverageGroup": null,
                            "shortName": "AD & D",
                            "limitPer": null,
                            "category": null,
                            "deductible": null,
                            "coverageLimitDisplayText": "$10,000",
                            "coverageLimitFormattedFor": "Traveler",
                            "groupRatings": null,
                            "subLimits": null,
                            "name": "Accidental Death & Dismemberment",
                            "effectiveDate": "2014-10-16T00:01:00Z",
                            "canRemoveCoverage": false,
                            "description": "The Insurer will pay this benefit up to the Maximum Limit shown on the Schedule of Benefits if: (a) the Insured is injured in an accident which happens while he/she is on a Trip and covered under the policy; and (b) he/she suffers one of the losses listed in the Description of Coverage within 365 days of the accident. The percentage of the Maximum Limit payable for each loss is shown in the Description of Coverage. The Insurer will not pay more than 100% of the Maximum Limit for all losses due to the same accident. See the Description of Coverage for complete details."
                        }
                    ],
                    "accountInformation": null,
                    "id": "a2DJ0000000EqB0MAK"
                }
            ],
            "flights": []
        };
    }

    function errorResponse() {
        return {
            "message": "An error has occurred.",
            "exceptionMessage": "Policy \"ALKJR\" you are searching for was not found."
        };
    }
    // #endregion
});
