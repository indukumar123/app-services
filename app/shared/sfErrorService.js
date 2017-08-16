(function () {

    'use strict';

    var myAppModule = angular.module('agentPortal');

    myAppModule.service('sfErrorService', function () {
        return {
            tryMakeErrorReadable: parseErrorMessage
        };

        /**
         * @description
         * function to parse Salesforce Errors
         */
        function parseErrorMessage(message) {
            var workingMessage = message;

            var firstErrorText = 'first error:';
            var firstErrorIndex = workingMessage.indexOf(firstErrorText);

            if (firstErrorIndex > -1) {
                workingMessage = workingMessage.substring(firstErrorIndex + firstErrorText.length);

                var commaText = ', ';
                var commaIndex = workingMessage.indexOf(commaText);

                if (commaIndex > -1) {
                    workingMessage = workingMessage.substring(commaIndex + commaText.length);
                    workingMessage = workingMessage.replace(/__c/g, '');
                    workingMessage = workingMessage.replace(/_/g, ' ');

                    workingMessage = workingMessage.substring(0, workingMessage.indexOf(':'));
                }
                else {
                    workingMessage = message;
                }
            }

            return workingMessage;
        }
    });
})();