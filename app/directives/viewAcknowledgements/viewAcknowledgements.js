(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name viewAcknowledgement
     *
     * # viewAcknowledgement
     *
     * @description
     * Displays a link for each acknowledgement passed in.  When a user clicks on the link, the acknowledgement
     * message is displayed in a modal.
     */
    angular.module('agentPortal')
        .directive('viewAcknowledgements', ['messageDisplayService', viewAcknowledgementsDirective]);

    angular.module('agentPortal')
        .controller('viewAcknowledgementsController', viewAcknowledgementsController);

    function viewAcknowledgementsDirective(messageDisplayService) {
        return {
            restrict: 'E',
            transclude: false,
            scope: {
                acknowledgements: '='
            },
            templateUrl: 'app/directives/viewAcknowledgements/viewAcknowledgements.html',
            controller: viewAcknowledgementsController,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    viewAcknowledgementsController.$inject = ['messageDisplayService']
    function viewAcknowledgementsController(messageDisplayService) {
        var vm = this;

        vm.hasAcknowledgements = function () {
            return vm.acknowledgements && vm.acknowledgements.length > 0;
        };

        vm.showAcknowledgement = function (selectedAcknowledgement) {
            // open a modal to display the acknowledgement message.
            messageDisplayService.displayAcknowledgementViewOnly(selectedAcknowledgement);
        };
    }
})();