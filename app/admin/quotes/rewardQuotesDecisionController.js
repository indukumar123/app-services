(function() {
    'use strict';

    angular.module('agentPortal')
        .controller('rewardQuotesDecisionController', rewardQuotesDecisionController);

    rewardQuotesDecisionController.$inject = ['$modalInstance', 'quotesIds', 'confirm', 'quotesService'];

    function rewardQuotesDecisionController($modalInstance, quotesIds, confirm, quotesService) {
        var vm = this;
        vm.quotes = quotesIds;
        vm.confirm = confirm;
        
        vm.confirmDecision = confirmDecision;
        vm.close = close;

        vm.quoteNumbers = '';
        for (var i = 0; i < quotesIds.length; i++) {
            vm.quoteNumbers += quotesIds[i];
            if (i != quotesIds.length - 1) {
                vm.quoteNumbers += ', ';
            }
        }

        var plural = quotesIds.length > 1;
        if (confirm) {
            vm.title = 'Confirm Quote';
            if (plural) {
                vm.message = 'The following quotes will be confirmed and converted to policies. The customers will receive a notification with their policy details:';
            }
            else {
                vm.message = 'The following quote will be confirmed and converted into a policy. The customer will receive a notification with his or her policy details:';
            }
        }
        else {
            vm.title = 'Cancel Quote';
            if (plural) {
                vm.message = 'The following quotes will be cancelled. The customers will receive a notification allowing them to purchase with a credit card:';
            }
            else {
                vm.message = 'The following quote will be cancelled. The customer will receive a notification allowing him or her to purchase with a credit card:';
            }
        }

        if (plural) {
            vm.title += 's';
        }

        function close() {
            $modalInstance.dismiss('cancel');
        };

        function confirmDecision() {
            if (vm.confirm) {
                quotesService.confirmRewardPointsQuotes(vm.quotes).then(function () {
                    // confirming is an async queued process so need to track quotes being processed
                    quotesService.setInProcessRewardQuotes(vm.quotes);
                    $modalInstance.close(vm.quotes);
                })
            }
            else {
                quotesService.denyRewardPointsQuotes(vm.quotes).then(function () {
                    $modalInstance.close(vm.quotes);
                });
            }
        }
    }
})();