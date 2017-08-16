(function () {
    'use strict';

    angular.module('agentPortal')
           .controller('fnolController', fnolController);

    fnolController.$inject = ['$stateParams', '$cookies'];
    function fnolController($stateParams, $cookies) {
        var vm = this;
        vm.policyNumber = $stateParams.policyNumber;
    }
})();