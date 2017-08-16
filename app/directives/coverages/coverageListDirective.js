(function () {
    'use strict';
    angular.module('agentPortal')
        .directive('coverageList', coverageListDirective)
    function coverageListDirective() {
        return {
            restrict: 'EA',
            scope: {
                coverages: '=',
                tripCost: '=',
                hideHeaders: '=',
                mode: '='
            },
            templateUrl: 'app/directives/coverages/coverageList.html',
            controller: coverageListCtrl,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    coverageListCtrl.$inject = [];
    function coverageListCtrl() {
        var vm = this;

        vm.showTwoColumns = function () {
            return vm.mode === 'receipt';
        };

        vm.showOptionalCoverages = function () {
            return vm.getUpgradeCoverages().length > 0 && vm.mode !== 'quote';
        };

        vm.getStandardCoverages = function () {
            return getCoveragesByType('Standard');
        };

        vm.getExtraCoverages = function () {
            return getCoveragesByType('Extra');
        };

        vm.getUpgradeCoverages = function () {
            return getCoveragesByType('Upgrade').concat(getCoveragesByType('Extra Upgrade'));
        };

        function getCoveragesByType(coverageType) {
            var response = [];
            if (vm.coverages) {
                for (var i = 0; i < vm.coverages.length; i++) {
                    if (vm.coverages[i].type === coverageType) {
                        response.push(vm.coverages[i]);
                    }
                }
            }

            return response;
        }
    }
})();