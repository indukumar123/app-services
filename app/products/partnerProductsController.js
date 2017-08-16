(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('partnerProductsController', ['$state', partnerProductsController]);



    function partnerProductsController($state) {

        var vm = this;

        vm.init = function () {
            $state.go('quote', { packageName: "leisureplus" });
        };


        vm.init();
    }

})();
