(function() {
    'use strict';

    /**
     * @ngdoc controller
     * @name sendQuoteController
     *
     * # sendQuoteController
     *
     * @description
     * sends quote information via email to provided email addresses.
     */
    angular.module('agentPortal')
        .controller('sendQuoteController', ['portalService', '$scope', '$modalInstance', '$timeout', 'quotesService', 'customersService', 'utilService', 'quote', sendQuoteController]);

    function sendQuoteController(portalService, $scope, $modalInstance, $timeout, quotesService, customersService, utilService, quote) {

        $scope.quoteSent = false;
        $scope.agent = {};
        $scope.quoteComment = null;

        /**
         * @description
         * sends quote information via email
         */
        $scope.sendQuote = function () {
            quotesService.emailQuote(quote.policy.quoteNumber, getEmailIds(), $scope.quoteComment)
                .then(function (response) {
                    $scope.quoteSent = true;
                    showMessage("Thank you, this quote has been sent.");
                }, function (error) {
                    showMessage("There was a problem sending email. Please try again later.");
                });
        };

        /**
         * @description
         * closes send-quote dialog box, i.e., when user clicks on Close or Cancel button
         */
        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        };

        /**
         * @description
         * initialization... loads primary quote holder's data etc.
         */
        var init = function () {
            portalService.getAgentByInternalId().then(function (agent) {
                $scope.agent = agent;

                var travelers = quote.travelers;

                // depending on where you are coming from, the object isn't always loaded the same
                // --sanity check for the quoteId
                if (!quote.policy) {
                    quote.policy = {};
                    quote.policy.quoteId = quote.quoteId;
                }

                if (quote.travelers == null && quote.policy.quoteId != null) {
                    quotesService.getById(quote.policy.quoteId).then(function (fullQuote) {
                        quote = fullQuote;
                        showPopup(fullQuote.travelers);
                    }, function (error) {
                        utilService.showPopup("Error", "Failed to retrieve quote.");
                    });
                } else if (quote.travelers != null) {
                    showPopup(quote.travelers);
                } else {
                    utilService.showPopup("Error", "Failed to retrieve required information for the quote.");
                }
            });
        };

        /**
         * @description
         * shows popup for send quote dialog
         */
        var showPopup = function (travelers) {
            var travelerAccountId = $.grep(travelers, function (traveler) {
                return traveler.isPrimary == true;
            })[0].travelerAccount;
            var customerResource = customersService.getById(travelerAccountId);
            var cctome = true;
            if ($scope.agent.isAmbassador) {
                cctome = false;
            }
            $scope.quoteData = { ccmeto: cctome, primaryemail: null, email: "", showMessage: false, message: "" };
            customerResource.then(function (customer) {
                $scope.quoteData = { ccmeto: cctome, primaryemail: customer.emailAddress, email: "", showMessage: false, message: "" };
                $timeout(function () { $('input[name="email"]').focus(); }, 100);
            }, function (error) {
                utilService.showPopup("Error", "Failed to retrieve primary traveler information.");
            });
        };

        /**
         * @description
         * returns email IDs by splitting user provided CSV-text by commas
         */
        var getEmailIds = function () {
            var emails = [];

            if ($scope.quoteData.email) {
                emails = emails.concat($scope.quoteData.email.split(','));
            }

            if ($scope.quoteData.ccmeto) {
                emails.push($scope.agent.emailAddress);
            }

            return emails;
        };

        /**
         * @description
         * shows message to the user on the dialog box
         */
        var showMessage = function (message) {
            $scope.quoteData.showMessage = true;
            $scope.quoteData.message = message;
            $timeout(function () { $('button[name="close"]').focus(); }, 100);
        };

        init();
    }
})();