/*global angular, moment */
/*jshint globalstrict: true*/

/**
 * @ngdoc directive(s)
 * @name validation
 *
 * # validation
 *
 * @description
 * generic validation directives, copied over from the consumer website of bhtp
 */
(function () {
    'use strict';
    var momentTimeUnitDays = 'days';
    var dolMinDate = 'dolMinDate';
    var dolMaxDate = 'dolMaxDate';

    function isEmpty(value) {
        return angular.isUndefined(value) || value === '' || value === null || value !== value;
    }

    angular.module('agentPortal')
        .directive('requiredField', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {
                        ctrl.$setValidity('required', true);
                        var regex = /^.+$/;
                        if (!regex.test(value)) {
                            ctrl.$setValidity('required', false);
                        }
                        return value;
                    });
                }
            };
        })
        .directive('validTravelerAge', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$validators.validTravlerAge = function (modelValue, viewValue) {
                        return validate(viewValue);
                    };

                    scope.$watch(function () {
                        return [attrs.ageMin, attrs.ageMax];
                    }, function (newVal, oldValue) {
                        validate(ctrl.modelValue || ctrl.$viewValue);
                    }, true);

                    function validate(value) {
                        var valid = true;
                        ctrl.$setValidity('validTravelerAge', true);
                        ctrl.$setValidity('validDate', true);
                        ctrl.$setValidity('minDate', true);
                        ctrl.$setValidity('maxDate', true);
                        ctrl.$setValidity('ageMin', true);
                        ctrl.$setValidity('ageMax', true);

                        if (value) {
                            var validateEighteen = scope.$eval(attrs.validateEighteen);
                            var validateAgeMin = scope.$eval(attrs.ageMin) || -1;
                            var validateAgeMax = scope.$eval(attrs.ageMax) || -1;
                            //Only run this check after all information has been entered
                            if (value != null && (typeof (value) == 'object' || value.indexOf("_") == -1)) {
                                // required
                                /* Handle with standard required attribute or ng-required
                                var regexp1 = /^.+$/;
                                if (!regexp1.test(value)) {
                                    ctrl.$setValidity('required', false);
                                    return value;
                                }
                                */

                                // validate is a date
                                if (typeof (value) == 'string' && !moment(value, ['MM-DD-YYYY', 'MM/DD/YYYY', 'M-D-YYYY', 'M/D/YYYY', 'YYYY-MM-DD'], true).isValid()) {
                                    ctrl.$setValidity('validDate', false);
                                    return false;
                                } else if (typeof (value) == 'object' && !moment(value).isValid()) {
                                    ctrl.$setValidity('validDate', false);
                                    return false;
                                }
                                //moment returns 10/10/0000 as 10/10/2000..checking year for minimum year in the DOB.
                                var splitDate = '';
                                var tempYear = '';
                                if (value.indexOf('/') > -1) {
                                    splitDate = value.split('/')
                                }
                                else if (value.indexOf('-') > -1) {
                                    splitDate = value.split('-')
                                }
                                if (splitDate.length > 0) {
                                    for (var x = 0; x < splitDate.length; x++) {
                                        if (splitDate[x].length == 4) {
                                            tempYear = splitDate[x];
                                            break;
                                        }
                                    }
                                    if (tempYear.length > 0) {
                                        if (parseInt(tempYear) < 1900) {
                                            ctrl.$setValidity('minDate', false);
                                            return false;
                                        }
                                    }
                                }

                                // validate max date
                                if (!moment(value).isBefore(moment())) {
                                    ctrl.$setValidity('maxDate', false);
                                    return false;
                                }

                                if (validateEighteen == true) {
                                    // validate age
                                    if (!moment(value).isBefore(moment().subtract('years', 18))) {
                                        ctrl.$setValidity('validTravelerAge', false);
                                        return false;
                                    }
                                }

                                // validate min age
                                if (validateAgeMin > -1) {
                                    if (!moment(value).isBefore(moment().subtract(validateAgeMin, 'years'))) {
                                        ctrl.$setValidity('ageMin', false);
                                        return false;
                                    }
                                }

                                // validate max age
                                if (validateAgeMax > -1) {
                                    if (!moment(value).isAfter(moment().subtract(validateAgeMax, 'years'))) {
                                        ctrl.$setValidity('ageMax', false);
                                        return false;
                                    }
                                }
                            }
                        }

                        return valid;
                    }
                }
            };
        })
        .directive('validZipCode', ['portalService', function (portalService) {
            return {
                require: 'ngModel',
                scope: { state: "=?", isState: "@" },
                link: function (scope, elem, attrs, ctrl) {
                    var zipCode = null;
                    var state = scope.state;
                    ctrl.$parsers.push(checkForReal);
                    ctrl.$formatters.push(checkForReal);
                    function checkForReal(value) {
                        zipCode = value;
                        //Do not call out if undefined
                        if (typeof value != 'undefined' && value !== null) {

                            //Reset Validity
                            ctrl.$setValidity('validZip', true);
                            ctrl.$setValidity('required', true);

                            //Do not call out if a valid zip is not provided.
                            var regexp1 = /^.+$/;
                            var regexp2 = /^\d{5}$/;
                            if (!regexp1.test(value)) {
                                ctrl.$setValidity('required', false);
                                return value;
                            }
                            if (!regexp2.test(value)) {
                                ctrl.$setValidity('validZip', false);
                                return value;
                            }

                            //Looks like a valid zip, so now check if it is real.
                            if (state) {
                                portalService.VerifyPostalCodeWithState(value, state, function (result) {
                                    //If we got a result lets check it,  otherwise just pass back value and assume it is valid
                                    //this is done in case the service is down we still want to register customers
                                    if (result) {
                                        if (result.result === true) {
                                            ctrl.$setValidity('validZip', true);
                                        }
                                        else if (result.result === false) {
                                            if (!ctrl.$dirty) {
                                                ctrl.$dirty = true;
                                            }
                                            if (!ctrl.$touched) {
                                                ctrl.$touched = true;
                                            }
                                            ctrl.$setValidity('validZip', false);
                                        }
                                    }
                                    return value;
                                }, function () { });
                            }
                            else {
                                if (scope.isState != "true") {
                                    portalService.VerifyPostalCode(value, function (result) {
                                        //If we got a result lets check it,  otherwise just pass back value and assume it is valid
                                        //this is done in case the service is down we still want to register customers
                                        if (result) {
                                            if (result.result === true) {
                                                ctrl.$setValidity('validZip', true);
                                            }
                                            else if (result.result === false) {
                                                ctrl.$setValidity('validZip', false);
                                            }
                                        }
                                        return value;
                                    }, function () { });
                                }
                            }
                        }
                        return value;
                    }                    // Updates typeahead when entity changed.
                    scope.$watch('state', function (newVal) {
                        if (newVal != undefined) {
                            state = newVal;
                            checkForReal(zipCode);
                        }
                    });
                }
            };
        }])
        .directive('validPhoneNumberAgent', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    elem.on('blur', function () {
                        ctrl.$parsers.unshift(function (value) {
                            ctrl.$setValidity('required', true);
                            ctrl.$setValidity('validPhone', true);

                            // required
                            var regexp1 = /^.+$/;
                            if (!regexp1.test(value)) {
                                ctrl.$setValidity('required', false);
                                return value;
                            }

                            var regexp2 = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
                            if (!regexp2.test(value)) {
                                ctrl.$setValidity('validPhone', false);
                                return value;
                            }

                            return value;
                        });
                    });
                }
            };
        })
        .directive('validFlightNumber', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {
                        var regexp1 = /^.+$/,
                            regexp2 = /^[0-9]+$/i;

                        ctrl.$setValidity('required', true);
                        ctrl.$setValidity('validFlightNumber', true);

                        // required
                        if (!regexp1.test(value)) {
                            ctrl.$setValidity('required', false);
                            return value;
                        }

                        // valid input
                        if (!regexp2.test(value)) {
                            ctrl.$setValidity('validFlightNumber', false);
                        }

                        return value;
                    });
                }
            };
        })
        .directive('validDepartureDate', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {

                        if (!value) {
                            ctrl.$setValidity('required', false);
                            return value;
                        }

                        var dateMoment = moment(value),
                            regexp1 = /^.+$/;

                        ctrl.$setValidity('invalid', true);
                        ctrl.$setValidity('required', true);

                        // required
                        if (!regexp1.test(value)) {
                            ctrl.$setValidity('required', false);
                            return value;
                        }

                        // date is correct format
                        if (dateMoment !== null && dateMoment.isValid()) {
                            // date not in the past
                            if (dateMoment.isBefore(moment(), 'day')) {
                                ctrl.$setValidity('invalid', false);
                            }
                        } else {
                            ctrl.$setValidity('invalid', false);
                        }

                        return value;
                    });
                }
            };
        })
        .directive('validRequiredString', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {
                        var regexp1 = /^.+$/;

                        ctrl.$setValidity('required', true);

                        // required
                        if (!regexp1.test(value)) {
                            ctrl.$setValidity('required', false);
                            return value;
                        }

                        return value;
                    });
                }
            };
        })
        .directive('validEmail', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {

                        ctrl.$setValidity('invalid', true);

                        if (value && value.trim().length > 0) {
                            var regexp2 = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                            if (!regexp2.test(value)) {
                                ctrl.$setValidity('invalid', false);
                            }
                        }

                        return value;
                    });
                }
            };
        })
        .directive('validTime', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (value) {
                        var regexp2 = /^(\d{1,2}):(\d{2})$/,
                            regGroup;

                        ctrl.$setValidity('invalid', true);

                        if (!regexp2.test(value)) {
                            ctrl.$setValidity('invalid', false);
                            return value;
                        }

                        regGroup = value.match(regexp2);

                        if (regGroup[1]) {
                            if (regGroup[1] < 1 || regGroup[1] > 12) {
                                ctrl.$setValidity('invalid', false);
                            }
                        }

                        if (regGroup[2]) {
                            if (regGroup[2] < 0 || regGroup[2] > 59) {
                                ctrl.$setValidity('invalid', false);
                            }
                        }

                        return value;
                    });
                }
            };
        })
        .directive('validExpiration', function () {
            return {
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    var watchString = '[:monthModel,:yearModel]'
                        .replace(':monthModel', attrs.ngModel)
                        .replace(':yearModel', attrs.expirationYear);
                    scope.$watch(watchString, function (values) {
                        ctrl.$setValidity('invalid', true);
                        if (!values[0] || !values[1])
                            return values;

                        var date = moment();
                        if (values[1] == date.year() && values[0] <= date.month()) {
                            ctrl.$setValidity('invalid', false);
                        }
                        return values;
                    }, true);
                }
            };
        })
        .directive('validCreateClaimDate', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, elem, attrs, ctrl) {
                    elem.on('blur', function () {

                        var value = elem.val();

                        ctrl.$setValidity('beforeeffective', true);
                        ctrl.$setValidity('afterexpiration', true);
                        ctrl.$setValidity('invaliddate', true);

                        var selectedPolicy = scope.validCreateClaimDate;
                        var dateOfLoss = moment(value);

                        if (dateOfLoss === null || !dateOfLoss.isValid()) {
                            ctrl.$setValidity('invaliddate', false);
                        }

                        var expirationDate = moment(selectedPolicy.expirationDate).format('MM/DD/YYYY');
                        var effectiveDate = moment(selectedPolicy.effectiveDate).format('MM/DD/YYYY');

                        if (dateOfLoss.isAfter(expirationDate)) {
                            ctrl.$setValidity('afterexpiration', false);
                        }

                        if (dateOfLoss.isBefore(effectiveDate)) {
                            ctrl.$setValidity('beforeeffective', false);
                        }

                        return value;

                    });

                },
                scope: {
                    validCreateClaimDate: '='
                }
            };
        })
        .directive('ngMin', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, $elem, attr, ctrl) {
                    ctrl.$parsers.push(minValidator);
                    ctrl.$formatters.push(minValidator);
                    //change in number of traverllers..
                    if (attr.ngTravellers) {
                        scope.$watch(attr.ngTravellers, function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                if (newValue == null || newValue == undefined) {
                                    newValue = oldValue;
                                } else {
                                    minValidator(ctrl.$viewValue);
                                }
                            }
                        }, true);
                    }

                    // validate user input when ngMin changes
                    scope.$watch(function () {
                        return [attr.ngMin];
                    }, function (newValue, oldValue) {
                        minValidator(ctrl.modelValue || ctrl.$viewValue);
                    }, true);

                    //validate max cost based on number of travellers..
                    function minValidator(value) {
                        // Inherited scope - Min trip cost comes in as an int already for additional travelers
                        var min = attr.ngMin == undefined ? 0 : attr.ngMin;

                        // Checks to see if min is a string object or if it's a string object (additional travelers pass this in as an int object)
                        if (typeof min === 'string' || min instanceof String) {
                            min = scope.$eval(min);
                        }

                        if (value === undefined) {
                            if (ctrl.$modelValue != null) {
                                value = min;
                                ctrl.$setViewValue(value);
                                ctrl.$render();
                            } else {
                                return undefined;
                            }
                        }

                        if (value && value.replace) {
                            value = value.replace != undefined ? parseFloat(value.replace(new RegExp(',', "g"), '')) : parseFloat(value);
                        }

                        if (!isEmpty(value) && value < min) {
                            ctrl.$setValidity('ngMin', false);
                            return value;
                        }

                        ctrl.$setValidity('ngMin', true);
                        return value;
                    };
                }
            };
        })
        .directive('ngMax', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, $elem, attr, ctrl) {
                    $elem.on('blur', function () {
                        var maxValidator = function (value) {
                            var max = scope.$eval(attr.ngMax) || Infinity;
                            var noofTravellers = noofTravellers = 1 + scope.$eval(attr.ngTravellers) || Infinity;
                            var comapre;
                            if (scope.$eval(attr.tripCostOption) === "true") {
                                comapre = value > max * noofTravellers;
                            } else {
                                comapre = value > max;
                            }
                            if (value && value.replace)
                                value = value.replace != undefined ? parseFloat(value.replace(new RegExp(',', "g"), '')) : parseFloat(value);
                            if (!isEmpty(value) && comapre) {
                                ctrl.$setValidity('ngMax', false);
                                return value;
                            }
                            ctrl.$setValidity('ngMax', true);
                            return value;
                        };

                        ctrl.$parsers.push(maxValidator);
                        ctrl.$formatters.push(maxValidator);
                    });

                }
            };
        })
        .directive('validDateAfter', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function ($scope, $element, $attrs, ctrl) {
                    var watchString = '[:ngModel,:otherModel]'
                        .replace(':ngModel', $attrs.ngModel)
                        .replace(':otherModel', $attrs.validDateAfter);
                    $scope.$watch(watchString, function (values) {
                        ctrl.$setValidity('dateAfter', true);
                        if (!values[0] || !values[1])
                            return values;

                        var currentMoment = moment(values[0]).format('YYYY-MM-DD');
                        var afterMoment = moment(values[1]).format('YYYY-MM-DD');
                        ctrl.$setValidity('dateAfter', moment(currentMoment).isAfter(afterMoment) || moment(afterMoment).isSame(currentMoment));
                        return values;
                    }, true);
                }
            };
        })
        .directive('validDateBefore', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function ($scope, $element, $attrs, ctrl) {
                    var watchString = '[:ngModel,:otherModel,:daysFromDate]'
                        .replace(':ngModel', $attrs.ngModel)
                        .replace(':otherModel', $attrs.validDateBefore)
                        .replace(':daysFromDate', $attrs.daysFromDate);
                    $scope.$watch(watchString, function (values) {
                        ctrl.$setValidity('dateBefore', true);
                        ctrl.$setValidity('mindate', true);
                        if (!values[0] || !values[1])
                            return values;

                        var currentMoment = moment(values[0]);
                        var beforeMoment = moment(values[1]);
                        var daysFromDate = values[2] || -1;

                        // validate min date
                        if (!currentMoment.isAfter(moment('1/1/1900'))) {
                            ctrl.$setValidity('mindate', false);
                            return false;
                        }

                        if (daysFromDate > 0 && currentMoment.isBefore(moment().subtract(daysFromDate, momentTimeUnitDays))) {
                            ctrl.$setValidity('daysFromDate', false);
                            return false;
                        }
                        else {
                            ctrl.$setValidity('daysFromDate', true);
                        }

                        ctrl.$setValidity('dateBefore', currentMoment.isBefore(beforeMoment) || currentMoment.isSame(beforeMoment));

                        return values;
                    }, true);
                }
            };
        })
        .directive('validTripLength', function () {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function ($scope, $element, $attrs, ctrl) {
                    var watchString = '[:ngModel,:otherModel,:tripLengthMin,:tripLengthMax]'
                        .replace(':ngModel', $attrs.ngModel)
                        .replace(':otherModel', $attrs.departureDate)
                        .replace(':tripLengthMin', $attrs.minTripLength)
                        .replace(':tripLengthMax', $attrs.maxTripLength);

                    $scope.$watch(watchString, function (values) {
                        ctrl.$setValidity('tripLength', true);
                        if (!values[0] || !values[1])
                            return values;

                        var returnMoment = moment(values[0]);
                        var departureMoment = moment(values[1]);
                        var minTripLength = parseInt(values[2], 10);
                        var maxTripLength = parseInt(values[3], 10);
                        var tripLength = moment(returnMoment).diff(moment(departureMoment), momentTimeUnitDays);
                        tripLength = tripLength + 1;

                        if (maxTripLength > 0) {
                            if (tripLength > maxTripLength)
                                ctrl.$setValidity('tripLengthMax', false);
                            else
                                ctrl.$setValidity('tripLengthMax', true);
                        }

                        if (minTripLength != null) {
                            if (tripLength < minTripLength) {
                                ctrl.$setValidity('tripLengthMin', false);
                            }
                            else {
                                ctrl.$setValidity('tripLengthMin', true);
                            }
                        }

                        return values;
                    }, true);
                }
            };
        })
        .directive('tripMax', function () {
            return {
                restrict: 'A',
                scope: {
                    tripCostOption: "=?",
                    ngTravellers: "=?"
                },
                require: 'ngModel',
                link: function (scope, element, attr, ctrl) {
                    ctrl.$parsers.unshift(checkForReal);
                    ctrl.$formatters.unshift(checkForReal);

                    // validate user input when tripMax changes
                    scope.$watch(function () {
                        return [attr.tripMax];
                    }, function (newValue, oldValue) {
                        checkForReal(ctrl.modelValue || ctrl.$viewValue);
                    }, true);

                    function checkForReal(value) {
                        ctrl.$setValidity('tripMax', true);
                        if ((value && value.replace) || (value && value.replace == undefined)) {
                            value = value.replace != undefined ? parseFloat(value.replace(new RegExp(',', "g"), '')) : parseFloat(value);
                            var max = scope.$eval(attr.tripMax) || Infinity;
                            var noofTravellers = noofTravellers = 1 + scope.ngTravellers || Infinity;
                            var comapre;
                            if (scope.tripCostOption === "true") {
                                comapre = value > max * noofTravellers;
                            } else {
                                comapre = value > max;
                            }
                            if (!isEmpty(value) && comapre) {
                                ctrl.$setValidity('tripMax', false);
                            }
                        };
                        return value;
                    }

                    // Updates typeahead when entity changed.
                    scope.$watch('tripCostOption', function (newVal, oldValue) {
                        checkForReal(ctrl.$viewValue);
                    });

                    // Updates typeahead when entity changed.
                    scope.$watch('ngTravellers', function (newVal, oldValue) {
                        checkForReal(ctrl.$viewValue);
                    });
                }
            };
        })
        .directive('formAutofillFix', function () {
            return function (scope, elem, attrs) {
                // Fixes Chrome bug: https://groups.google.com/forum/#!topic/angular/6NlucSskQjY
                elem.prop('method', 'POST');

                // Fix autofill issues where Angular doesn't know about autofilled inputs
                if (attrs.ngSubmit) {
                    setTimeout(function () {
                        elem.unbind('submit').submit(function (e) {
                            e.preventDefault();
                            elem.find('input, textarea, select').trigger('input').trigger('change').trigger('keydown');
                            scope.$apply(attrs.ngSubmit);
                        });
                    }, 0);
                }
            };
        })
        .directive(dolMinDate, function () {
            return {
                restict: 'A',
                require: '?ngModel',
                link: link
            };

            function link(scope, elem, attrs, ctrl) {
                attrs.$observe(dolMinDate, function (value) {
                    if (value) {
                        validate(ctrl.$viewValue);
                    }
                });

                ctrl.$validators.dolMinDate = function (modelValue, viewValue) {
                    return validate(modelValue);
                };

                function validate(value) {
                    var valid = true;

                    if (value) {
                        var thisDate = moment(new Date(value));

                        if (attrs.dolMinDate) {
                            var minDate = moment(new Date(attrs.dolMinDate));

                            valid = thisDate.isSame(minDate, momentTimeUnitDays) || thisDate.isAfter(minDate, momentTimeUnitDays);
                            ctrl.$setValidity(dolMinDate, valid);
                        }
                    }

                    return valid;
                }
            }
        })
        .directive(dolMaxDate, function () {
            return {
                restict: 'A',
                require: 'ngModel',
                link: link
            };

            function link(scope, elem, attrs, ctrl) {
                attrs.$observe(dolMaxDate, function (value) {
                    if (value) {
                        validate(ctrl.$viewValue);
                    }
                });

                ctrl.$validators.dolMaxDate = function (modelValue, viewValue) {
                    return validate(modelValue);
                };

                function validate(value) {
                    var valid = true;

                    if (value) {
                        var thisDate = moment(new Date(value));

                        if (attrs.dolMaxDate) {
                            var maxDate = moment(new Date(attrs.dolMaxDate));

                            valid = thisDate.isSame(maxDate, momentTimeUnitDays) || thisDate.isBefore(maxDate, momentTimeUnitDays);
                            ctrl.$setValidity(dolMaxDate, valid);
                        }
                    }

                    return valid;
                }
            }
        });
}());