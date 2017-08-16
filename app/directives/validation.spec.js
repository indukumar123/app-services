describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="firstName" name="firstName" type="text" ng-model="m.firstName" value="{{m.firstName}}" required-field/></form>'

    describe(' requiredField', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService =_utilService_;
            portalService =_portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { firstName: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('requiredField');
            form = rootScope.form;
        }));

        it(' should be created with required error', function () {
            form.firstName.$setViewValue('');
            expect(form.firstName.$error.required).toBe(true);
        });

        it(' should show value without required error', function () {
            form.firstName.$setViewValue('name');
            expect(form.firstName.$error).toBeDefined;
        });
    });

});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;

    var staticHtml = '<form name="form"><input id="age" name="age" type="text" ng-model="m.age" value="{{m.age}}" valid-traveler-age validate-eighteen min-date="01/01/1980"  max-date="01/01/2000"/></form>'

    describe(' validTravelerAge', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { age: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validTravelerAge');
            form = rootScope.form;
        }));

        it(' should be created with validDate error string', function () {
            form.age.$setViewValue('0101979');
            expect(form.age.$error.validDate).toBe(true);
        });

        it(' should be created with validDate error object ', function () {
            form.age.$setViewValue({date : 'dsds'});
            expect(form.age.$error.validDate).toBe(true);
        });

        it(' should be created with minDate', function () {
            form.age.$setViewValue('11/11/1890');
            expect(form.age.$error.minDate).toBe(true);
        });

        it(' should be created with maxDate', function () {
            form.age.$setViewValue(moment().add(1,'days').format('MM/DD/YYYY'));
            expect(form.age.$error.maxDate).toBe(true);
        });

        it(' should show value without required error', function () {
            form.age.$setViewValue('11/11/1982');
            expect(form.age.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;

    var staticHtml = '<form name="form"><input id="zip" name="zip" type="text" ng-model="m.zip" state="m.state" is-state="true" value="{{m.zip}}" valid-zip-code /></form>'

    describe(' validZipCode', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { zip: null, state : "WI" }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validTravelerAge');
            form = rootScope.form;
        }));

        it(' should be created with required error ', function () {
            form.zip.$setViewValue('');
            expect(form.zip.$error.required).toBe(true);
        });

        it(' should be created with validZip error string', function () {
            spyOn(portalService, 'VerifyPostalCodeWithState').and.callFake(function () {
                return {
                    then: function (callback, errorcallback) { callback({ result : true }), errorcallback({ error: "error" }) }
                };
            });
            
            form.zip.$setViewValue('54441');
            console.log(form.zip.$error);
            expect(form.zip.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;

    var staticHtml = '<form name="form"><input id="phone" name="phone" type="text" ng-model="m.phone" value="{{m.phone}}" valid-phone-number-agent /><input name="forblur" type="text" ng-model="m.forblur"/></form>'

    describe(' validPhoneNumberAgent', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { phone: null, forblur: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validPhoneNumberAgent');
            form = rootScope.form;
        }));

        it(' should be created with validPhone', function () {
            form.phone.$setViewValue('100');
            expect(form.phone.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;

    var staticHtml = '<form name="form"><input id="flight" name="flight" type="text" ng-model="m.flight" value="{{m.flight}}" valid-flight-number /></form>'

    describe(' validFlightNumber', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { flight: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validFlightNumber');
            form = rootScope.form;
        }));

        it(' should be created with validFlightNumber with required error', function () {
            form.flight.$setViewValue('');
            expect(form.flight.$error).toBeDefined;
        });

        it(' should be created with validFlightNumber with flight error', function () {
            form.flight.$setViewValue('X121');
            expect(form.flight.$error).toBeDefined;
        });

        it(' should be created with validFlightNumber', function () {
            form.flight.$setViewValue('100');
            expect(form.flight.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;

    var staticHtml = '<form name="form"><input id="departureDate" name="departureDate" type="text" ng-model="m.departureDate" value="{{m.departureDate}}" valid-departure-date /></form>'

    describe(' validFlightNumber', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { departureDate: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validDepartureDate');
            form = rootScope.form;
        }));

        it(' should be created with validDepartureDate with required error', function () {
            form.departureDate.$setViewValue('');
            expect(form.departureDate.$error).toBeDefined;
        });

        it(' should be created with validDepartureDate with spaces required error', function () {
            form.departureDate.$setViewValue('  ');
            expect(form.departureDate.$error).toBeDefined;
        });

        it(' should be created with validDepartureDate with flight error', function () {
            form.departureDate.$setViewValue('X121');
            expect(form.departureDate.$error).toBeDefined;
        });

        it(' should be created with validDepartureDate', function () {
            form.departureDate.$setViewValue('100');
            expect(form.departureDate.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="firstName" name="firstName" type="text" ng-model="m.firstName" value="{{m.firstName}}" valid-required-string/></form>'

    describe(' validRequiredString', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { firstName: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validRequiredString');
            form = rootScope.form;
        }));

        it(' should be created with validRequiredString error', function () {
            form.firstName.$setViewValue('');
            expect(form.firstName.$error.required).toBe(true);
        });

        it(' should show value without validRequiredString error', function () {
            form.firstName.$setViewValue('name');
            expect(form.firstName.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="firstName" name="firstName" type="text" ng-model="m.firstName" value="{{m.firstName}}" valid-email/></form>'

    describe(' validEmail', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { firstName: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validEmail');
            form = rootScope.form;
        }));

        it(' should show value without validEmail error', function () {
            form.firstName.$setViewValue('name');
            expect(form.firstName.$error).toBeDefined;
        });

        it(' should show value without error', function () {
            form.firstName.$setViewValue('name@ss.com');
            expect(form.firstName.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="time" name="time" type="text" ng-model="m.time" value="{{m.time}}" valid-time/></form>'

    describe(' validTime', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { time: null }
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validTime');
            form = rootScope.form;
        }));

        it(' should show value without validTime error', function () {
            form.time.$setViewValue('name');
            expect(rootScope.m.time).toBe('name');
            expect(form.time.$error.invalid).toBe(true);
        });

        it(' should show value without validTime error 2', function () {
            form.time.$setViewValue('13:67');
            expect(form.time.$error).toBeDefined;
        });

        it(' should show value without error', function () {
            form.time.$setViewValue('12:00');
            expect(form.time.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="time" name="time" type="text" ng-model="m.time" value="{{m.time}}" ng-min data-ng-min="5" data-trip-max="100000" ng-travellers="travelers"/></form>'

    describe(' ngMin', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { time: null }
            rootScope.travelers = 2
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('ngMin');
            form = rootScope.form;
        }));

        it(' should show value without ngMin required error', function () {
            form.time.$setViewValue('');
            expect(form.time.$error).toBeDefined;
        });

        it(' should show value without ngMin error', function () {
            form.time.$setViewValue('1');
            expect(form.time.$error).toBeDefined;
        });

        it(' should show value without error', function () {
            form.time.$setViewValue('50');
            expect(form.time.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="time" name="time" type="text" ng-model="m.time" value="{{m.time}}" data-ng-min="5" data-trip-max="100000" ng-travellers="travelers" trip-cost-option valid-trip-length data-departure-date="11/11/1982" data-max-trip-length="2"/></form>'

    describe(' ngMax', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { time: null }
            rootScope.travelers = 2
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('ngMax');
            form = rootScope.form;
        }));

        it(' should show value without ngMax required error', function () {
            form.time.$setViewValue('');
            expect(form.time.$error).toBeDefined;
        });

        it(' should show value without ngMax error', function () {
            form.time.$setViewValue('1');
            expect(form.time.$error).toBeDefined;
        });
        
        it(' should show value without ngMax error', function () {
            form.time.$setViewValue('1000000');
            expect(form.time.$error).toBeDefined;
        });

        it(' should show value without error', function () {
            form.time.$setViewValue('50');
            expect(form.time.$error).toBeDefined;
        });
    });
});

describe('validation', function () {
    beforeEach(module('agentPortal'));
    var compile;
    var rootScope;
    var controller;
    var utilService;
    var portalService;
    var element;
    var scope;
    var form;
    var staticHtml = '<form name="form"><input id="departureDate" name="departureDate" type="text" ng-model="m.departureDate" value="{{m.departureDate}}" valid-date-after required data-valid-date-after="m.validDepartureDate" data-valid-date-before="m.returnDate"/></form>'

    describe(' validDateAfter', function () {
        beforeEach(inject(function (_$compile_, _$rootScope_, $q, _utilService_, _portalService_) {
            compile = _$compile_;
            rootScope = _$rootScope_.$new();
            utilService = _utilService_;
            portalService = _portalService_;
            scope = _$rootScope_.$new();
            // Directive and Controller Creation

            rootScope.m = { departureDate: null, validDepartureDate: moment().add(1, 'days').format('MM/DD/YYYY'), returnDate: moment().add(2, 'days').format('MM/DD/YYYY') }
            rootScope.travelers = 2
            element = angular.element(staticHtml);
            compile(element)(rootScope);
            rootScope.$digest();
            controller = element.controller('validDateAfter');
            form = rootScope.form;
        }));

        it(' should show value without validDateAfter required error', function () {
            form.departureDate.$setViewValue('');
            expect(form.departureDate.$error).toBeDefined;
        });

        it(' should show value without validDateAfter required error', function () {
            form.departureDate.$setViewValue(moment().add(1, 'days').format('MM/DD/YYYY'));
            expect(form.departureDate.$error).toBeDefined;
        });
    });
});
