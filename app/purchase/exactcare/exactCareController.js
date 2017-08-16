(function () {
    'use strict';

    angular
        .module('agentPortal')
        .controller('exactCareController', exactCareController);

    /**
    * @ngdoc controller
    * @name exactCareController
    *
    * # exactCareController
    *
    * @description
    * controller to support exactCare related activities
    */
    exactCareController.$inject = ['$stateParams'];

    function exactCareController($stateParams) {
        var vm = this;
        vm.packageId = null;

        function init() {
            vm.packageId = $stateParams.packageId;
        }

        init();
    };
})();