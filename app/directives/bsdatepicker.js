/*global angular */
/*jshint globalstrict: true*/

/**
 * @ngdoc directive
 * @name bsDatePicker
 *
 * # bsDatePicker
 *
 * @description
 * Date picker functionality for the date fields
 */
(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('bsDatepickerM', function () {
            return {
                require: 'ngModel',
                scope: {
                    date: '=ngModel'
                },
                link: function (scope, elem, attrs, ctrl) {
                    var $elem = $(elem),
                        setModel = function (mDate) {
                            scope.date = mDate;
                            return mDate;
                        },
                        setValidity = function (mDate) {
                            ctrl.$setValidity("date", mDate.isValid()); // TODO: is this the correct usage?
                            return mDate;
                        };

                    $elem.blur(function () {
                        $elem.datepicker('hide');
                        if (moment($elem.datepicker().val()) == null || moment($elem.datepicker().val())._d == "Invalid Date") {
                            $elem.datepicker('setValue', moment());
                        }
                        else {
                            $elem.datepicker('setValue', moment($elem.datepicker().val()));
                            scope.date = moment($elem.datepicker().val());
                        }
                    });

                    $elem.datepicker().on('changeDate', function (ev) {
                        scope.$apply(function () {
                            setValidity(setModel(moment(ev.date)));
                        });
                        $elem.datepicker('hide');
                    });

                    ctrl.$parsers.push(function (value) {
                        return setValidity(moment(value)); // TODO: read format set on attribute
                    });

                    ctrl.$render = function () {
                        if (!scope.date) {
                            scope.date = moment($elem.val());
                        }
                        if (typeof (scope.date) == 'string') {
                            scope.date = moment(scope.date);
                        }

                        $elem.datepicker('setValue', scope.date.isValid() ? scope.date : "");
                    };

                    //                if (scope.date === undefined || scope.date === 'Invalid date') {
                    //                    scope.date = moment();
                    //                }

                    setModel(scope.date);

                    //                scope.$watch('date', function (date) {
                    //                    if (date) {
                    //                        //$elem.datepicker('setValue', date.isValid() ? date.toDate() : moment().toDate());
                    //                        $elem.datepicker('setValue', moment($elem.datepicker().val()));
                    //                        //setValidity(date);
                    //                    }
                    //                });

                    var component = $elem.siblings('[data-toggle="datepicker"]');
                    if (component.length) {
                        component.on('click', function () {
                            if (!$elem.prop('disabled')) {
                                $elem.trigger('focus');
                            }
                        });
                    }
                }
            };
        });
})();