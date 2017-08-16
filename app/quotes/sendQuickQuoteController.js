(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name sendQuickQuoteController
     *
     * @description
     * sends quick quote information via email to provided email addresses.
     */
    angular.module('agentPortal')
        .controller('sendQuickQuoteController', ['portalService', '$scope', '$modalInstance', '$timeout', 'googletagmanager', 'onSendQuote', 'quickQuoteRequest', 'packages', sendQuickQuoteController]);

    function sendQuickQuoteController(portalService, $scope, $modalInstance, $timeout, googletagmanager, onSendQuote, quickQuoteRequest, packages) {
        var vm = this;

        vm.quoteSent = false;
        vm.sendingQuote = false;
        vm.recipients = null;
        vm.agentCarbonCopy = true;
        vm.packagesToQuote = [];
        vm.message = null;
        vm.agent = {};

        vm.onSendQuote = onSendQuote;
        vm.quickQuoteRequest = quickQuoteRequest;
        vm.packages = packages;

        vm.sendQuote = function () {
            
            vm.sendingQuote = true;

            vm.quickQuoteRequest.recipients = getEmailIds();
            if (vm.agentCarbonCopy === true && vm.agent) {
                vm.quickQuoteRequest.agentCarbonCopy = vm.agent.emailAddress;
            }

            vm.quickQuoteRequest.message = vm.message;
            vm.quickQuoteRequest.quotes = vm.packagesToQuote;

            googletagmanager.customEvent('sendquickquote', vm.quickQuoteRequest);
            vm.onSendQuote(vm.quickQuoteRequest).then(function (response) {
                vm.quoteSent = true;
                showMessage("Thank you, this quote has been sent.");
            }, function (error) {
                showMessage("There was a problem sending email. Please try again later.");
            }).finally(function () {
                vm.sendingQuote = false;
            });
        };

        vm.selectedPackage = function (pkg) {
            var pkgIndex = vm.packagesToQuote.indexOf(pkg);
            if (pkgIndex > -1) {
                vm.packagesToQuote.splice(pkgIndex, 1);
            }
            else {
                vm.packagesToQuote.push(pkg);
            }
        };

        /**
         * @description
         * closes send-quote dialog box, i.e., when user clicks on Close or Cancel button
         */
        vm.close = function () {
            $modalInstance.dismiss('cancel');
        };

        /**
         * @description
         * returns email IDs by splitting user provided CSV-text by commas
         */
        var getEmailIds = function () {
            var emails = [];

            if (vm.recipients) {
                emails = emails.concat(vm.recipients.split(','));

                // trim whitespace from all emails
                for (var i = 0; i < emails.length; i++) {
                    emails[i] = emails[i].trim();
                }
            }

            return emails;
        };

        /**
         * @description
         * shows message to the user on the dialog box
         */
        var showMessage = function (message) {
            vm.showMessage = true;
            vm.responseMessage = message;
            $timeout(function () { $('button[name="close"]').focus(); }, 100);
        };

        // get the agent so their email can be used for CC'ing
        portalService.getAgentByInternalId().then(function (agent) {
            vm.agent = agent;
        });
    }
})();