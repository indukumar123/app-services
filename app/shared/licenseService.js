(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('licenseService', licenseService);

    licenseService.$inject = ['portalService'];

    function licenseService(portalService) {
        var service = {
            canBhtpSell: canBhtpSell,
            canAgencySell: canAgencySell,
            getSellingStates: getSellingStates,
            getCanSellInState: getCanSellInState,
            getStateLicense : getStateLicense
        };

        return service;

        function canBhtpSell(packageId, stateCode) {
            return portalService.loadStatesForBhtp().then(function (states) {
                return getCanSellInState(getSellingStates(states, packageId), stateCode);
            });
        }

        function canAgencySell(packageId, stateCode, agent) {
            return portalService.loadStatesForAgent(agent.agentId).then(function (response) {
                return getCanSellInState(getSellingStates(response.states, packageId), stateCode);
            });
        }

        function getSellingStates(states, packageId) {
            return $.grep(states, function (state) {
                return $.grep(state.products, function (product) {
                    return product.canSell && $.grep(product.packages, function (pkg) {
                        return pkg.id == packageId && pkg.canSell;
                    }).length > 0;
                }).length > 0;
            });
        }

        function getCanSellInState(states, stateCode) {
            return $.grep(states, function (state) {
                return state.code == stateCode;
            }).length > 0;
        }

        function getStateLicense(agentCode, ratingId, stateCode) {
            //state, partner, packge
            return portalService.getStateLicense(stateCode, agentCode, ratingId).then(function (response) {
                return response;
            });
        }
    }

})();
