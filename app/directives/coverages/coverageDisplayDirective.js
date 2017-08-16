(function () {
    'use strict';
    angular.module('agentPortal')
        .directive('coverageDisplay', coverageDisplayDirective)
    function coverageDisplayDirective() {
        return {
            restrict: 'EA',
            scope: {
                coverage: '=',
                tripCost: '=',
                lastCoverage: '=',
                mode: '='
            },
            templateUrl: 'app/directives/coverages/coverageDisplay.html',
            controller: coverageDisplayCtrl,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    coverageDisplayCtrl.$inject = ['format', 'utilService'];
    function coverageDisplayCtrl(format, utilService) {
        var vm = this;

        vm.formatCoverage = function () {
            if (!vm.tripCost && vm.tripCost !== 0) {
                return format.formatCoverageLimits(vm.coverage);
            }
            else {
                return format.formatCoverageLimits(vm.coverage, parseFloat(vm.tripCost, 10));
            }
        };

        vm.showCoverageDetails = function () {
            utilService.showMessagePopup(vm.coverage.name, vm.coverage.description);
        };
    }
})();