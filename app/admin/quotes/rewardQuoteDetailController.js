(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('rewardQuoteDetailController', rewardQuoteDetailController);

    rewardQuoteDetailController.$inject = ['quotesService', '$stateParams', '$state'];

    function rewardQuoteDetailController(quotesService, $stateParams, $state) {
        var vm = this;
        vm.confirmPoints = confirmPoints;
        vm.cancelPoints = cancelPoints;

        function confirmPoints() {
            quotesService.confirmRewardPoints([vm.quote.quoteNumber]).result.then(function (quoteIds) {
                $state.go('adminVerifyPoints');
            });
        }

        function cancelPoints() {
            quotesService.cancelRewardPoints([vm.quote.quoteNumber]).result.then(function (quoteIds) {
                $state.go('adminVerifyPoints');
            });
        }

        function init() {
            quotesService.getRewardQuote($stateParams.quoteNumber).
                then(function (quote) {
                    if (quote && quote.quoteNumber) {
                        vm.quote = quote;
                    }
                    else {
                        vm.errorMessage = 'Unable to find quote ' + $stateParams.quoteNumber;
                    }
                })
                .catch(function (err) {
                    vm.errorMessage = 'An error occurred while retrieving the quote';
                });;
        }

        init();
    }
})();