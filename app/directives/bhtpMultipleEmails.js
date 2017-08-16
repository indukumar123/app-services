(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpMultipleEmails
     *
     * # bhtpMultipleEmails
     *
     * @description
     * directive for pages requiring multiple emails data entry in form of comma separated values
     */
    angular.module('agentPortal')
        .directive('bhtpMultipleEmails', [bhtpMultipleEmailsDirective]);

    function bhtpMultipleEmailsDirective() {
        var emailRegExp = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

        /**
          * @description
          * validates CSVs for emails against regex 
          */
        function validateAll(ctrl, validatorName, value) {
            var validity = ctrl.$isEmpty(value) || value.split(',').every(
                function (email) {
                    return emailRegExp.test(email.trim());
                }
            );

            ctrl.$setValidity(validatorName, validity);
            return validity ? value : undefined;
        }

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function postLink(scope, elem, attrs, modelCtrl) {
                function multipleEmailsValidator(value) {
                    return validateAll(modelCtrl, 'multipleEmails', value);
                }

                modelCtrl.$formatters.push(multipleEmailsValidator);
                modelCtrl.$parsers.push(multipleEmailsValidator);
            }
        };
    }
}());