(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name ngChangeWithBlur
     *
     * # ngChangeWithBlur
     *
     * @description
     * On focus, it stores the value it finds, on blur, it get the value in the field, if they are not the same, it executes the passed function
     *
     * Example of input
     * ============================================
     * {
     *    condition:false,
     *    formName:'optionalCoverageForm',
     *    fields:['carPickupDate','carReturnDate']
     * }
     */
    angular.module('agentPortal').
        directive('ngClearOnCondition', function () {
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function (scope, elem, attrs) {
                    elem.on('change', function () {

                        var valueToEval = null;

                        if (attrs.type === 'checkbox') { // || attrs.type === 'radio' ) {  // Considerations for extension
                            valueToEval = elem[0].checked;
                        }
                        //else {
                        //    valueToEval = elem.val();
                        //}

                        var input = attrs.ngClearOnCondition;
                        var config = scope.$eval(input);

                        if (valueToEval === config.condition) {

                            for (var i in config.fields) {
                                var formItem = (scope[config.formName][config.formName] !== undefined) ? scope[config.formName][config.formName] : scope[config.formName];
                                formItem = formItem[config.fields[i]];

                                if (formItem !== undefined) {
                                    formItem.$setViewValue(null);
                                    formItem.$render();
                                    formItem.$setPristine();
                                }
                            }
                        } else {
                            for (var i in config.fields) {
                                var formItem = (scope[config.formName][config.formName] !== undefined) ? scope[config.formName][config.formName] : scope[config.formName];
                                formItem = formItem[config.fields[i]];

                                if (formItem !== undefined) {
                                    formItem.$render();
                                }
                            }
                        }
                    });
                }
            };
        });
})();