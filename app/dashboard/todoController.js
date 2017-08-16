(function() {
    'use strict';
    /**
     * @ngdoc controller
     * @name todoController
     *
     * # todoController
     *
     * @description
     * controller for facilitating TODOs for the dashboard page
     */
    angular.module('agentPortal')
        .controller('todoController', ['$scope', '$filter', '$q', 'todoService', 'portalService', todoController]);

    function todoController($scope, $filter, $q, todoService, portalService) {
        var vm = this;

        vm.title = 'Tasks';
        vm.config = {
            showDrop: true
        };
        vm.todos = [];
        vm.ready = false;

        vm.selectedProduct = '';

        portalService.loadProductsPackagesFromClientsApi().then(function (response) {
            vm.productList = response.packages;
            vm.ready = true;
        });

        /**
         * @description
         * loads TODOs from the database
         */
        vm.loadTodos = function () {
            return todoService.getTodos();
        };

    }
})();