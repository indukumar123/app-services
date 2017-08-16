/* jshint -W074 */
(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('purchaseNavigationService', purchaseNavigationService);

    purchaseNavigationService.$inject = ['$state', 'productRatingIds'];

    function purchaseNavigationService($state, productRatingIds) {

        var service = {
            navigateToPurchase: navigateToPurchase
        };
        return service;

        function navigateToPurchase(currentPackage, customerId, quoteId, sessionId) {
            if (currentPackage) {
                sessionId = sessionId ? sessionId : new Date().getTime();

                // if this is a vacation guard product, navigation to purchase controller so
                // it can setup appropriate data
                if (currentPackage.productRatingId === productRatingIds.vacationGuard) {
                    if (customerId) {
                        $state.go('purchasePackageCustomer', { ratingId: currentPackage.ratingId, customerId: customerId, sessionId: sessionId });
                    }
                    else if (quoteId) {
                        $state.go("purchasePackageQuote", { ratingId: currentPackage.ratingId, quoteId: quoteId });
                    }
                    else {
                        $state.go('purchasePackage', { ratingId: currentPackage.ratingId, sessionId: sessionId });
                    }
                }
                else {
                    // if bhtp product, navigate directly to the purchase path
                    $state.go('purchaseBHTP',
                        {
                            ratingId: currentPackage.ratingId,
                            customerId: customerId,
                            quoteId: quoteId,
                            sessionId: sessionId
                        });
                }
            }
        }
    }

})();
