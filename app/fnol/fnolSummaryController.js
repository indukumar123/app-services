(function () {
    'use strict';

    angular.module('agentPortal')
           .controller('fnolSummaryController', fnolSummaryController);

    fnolSummaryController.$inject = ['fnolService', '$state', 'moment'];
    function fnolSummaryController(fnolService, $state, moment) {
        var vm = this;

        vm.actionsAreRequired = false;
        vm.claim = fnolService.getCurrentClaim();
        if (!vm.claim || vm.claim === null) {
            $state.go('dashboard');
        }

        init();

        function init() {
            if (vm.claim && vm.claim !== null) {
                if (vm.claim.claimForm && vm.claim.claimForm !== null) {
                    vm.actionsAreRequired = true;
                }

                if (vm.claim.claimedTravelers && vm.claim.claimedTravelers !== null) {
                    var travelerNames = [];
                    for (var i = 0; i < vm.claim.claimedTravelers.length; i++) {
                        travelerNames.push(vm.claim.claimedTravelers[i].travelerName);
                    }

                    vm.claim.displayTravelerList = travelerNames.join(', ');
                }

                if (vm.claim.flight && vm.claim.flight !== null) {
                    vm.claim.flight.displayDepartureDate = moment(vm.claim.flight.departureDate).format('L');
                }

                if (vm.claim.dateTimeOfLoss && vm.claim.dateTimeOfLoss !== null) {
                    vm.claim.displayDateTimeOfLoss = moment(vm.claim.dateTimeOfLoss).format('L');
                }
                vm.claim.isCruise = vm.claim.isCruise === true ? 'Yes' : 'No';
            }
        }
    }
})();