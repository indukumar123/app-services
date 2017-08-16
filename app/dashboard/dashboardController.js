(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('dashboardController', ['quickQuotesService', 'portalService', dashboardController]);

    function dashboardController(quickQuotesService, portalService) {
        var vm = this;

        vm.state = {};
        vm.agent = portalService.getCurrentAgent();
        vm.state.cta = quickQuotesService.getCombinedQuoteRequest(null);
        vm.tempQuote = null;
        vm.currentState = null;
        vm.currentAgentCode = null;
    }

})();
