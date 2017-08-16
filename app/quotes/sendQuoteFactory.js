(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('sendQuoteFactory', ['$rootScope', '$modal', 'quotesService', 'utilService', sendQuoteFactory]);

    function sendQuoteFactory($rootScope, $modal, quotesService, utilService) {

        var service = {
            sendQuote: sendQuote,
            sendQuickQuote: sendQuickQuote
        };

        return service;

        function sendQuote(quote) {
            var packageRatingId;
            
            if (quote.policy) {
                packageRatingId = quote.policy.packageRatingId;
            } else {
                packageRatingId = quote.packageRatingId;
            }

            quotesService.getProducts().then(function (packages) {
                var packageName = packages.filter(function (pkg) {
                    return pkg.ratingId === packageRatingId;
                })[0].name;

                // verify that we can email the quote
                var emailQuoteExclusions = ($rootScope.config && $rootScope.config && $rootScope.config.CLIENT_EMAILQUOTE_EXCLUSIONS) ? $rootScope.config.CLIENT_EMAILQUOTE_EXCLUSIONS.split(',') : '';
                if (emailQuoteExclusions.indexOf(packageRatingId) > -1) {
                    utilService.showMessagePopup('Email Quote Unavailable', 'In order to get you ' + packageName + ' sooner, the ability to email quotes to customers is temporarily unavailable.  Please contact your customer to review the quote.  We will let you know when this feature becomes available.');
                } else {
                    openEmailQuoteModal(quote);
                }
            });
        };

        function sendQuickQuote(quickQuoteRequest, packagesToQuote) {
            openEmailQuickQuoteModal(quickQuoteRequest, packagesToQuote);
        }

        function onSendQuickQuote(quickQuoteRequest) {
            return quotesService.emailQuickQuote(quickQuoteRequest);
        }

        function openEmailQuickQuoteModal(quickQuoteRequest, packagesToQuote) {
            $modal.open({
                templateUrl: 'app/quotes/sendQuickQuoteModal.html',
                backdrop: true,
                windowClass: 'modal',
                controller: 'sendQuickQuoteController',
                controllerAs: 'vm',
                resolve: {
                    onSendQuote: function() {
                        return onSendQuickQuote;
                    },
                    quickQuoteRequest: function() {
                        return quickQuoteRequest;
                    },
                    packages: function() {
                        return packagesToQuote;
                    }
                }
            });
        }

        function openEmailQuoteModal(quote) {
            $modal.open({
                templateUrl: 'app/quotes/sendQuoteModal.html',
                backdrop: true,
                windowClass: 'modal',
                controller: 'sendQuoteController',
                resolve: {
                    quote: function () {
                        return quote;
                    }
                }
            });
        }
    }
})();