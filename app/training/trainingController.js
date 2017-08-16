(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name trainingController
     *
     * # trainingController
     *
     * @description
     * controller for trainings page, handles interaction for displaying the TODOItems and marking them complete when user clicks on them
     */
    angular.module('agentPortal')
        .controller('trainingController', ['$scope', '$rootScope', '$filter', '$q', 'todoService', bhtpTodosController]);

    function bhtpTodosController($scope, $rootScope, $filter, $q, todoService) {
        var vm = this;

        vm.airCareTitle = 'Tasks';
        vm.exactCareTitle = 'ExactCare';
        vm.config = {
            showDropDown: false
        };

        vm.aircareTodos = [];
        vm.exactCareTodos = [];
        
        vm.airCareProduct = '';
        vm.exactCareProduct = '';

        //hard coded package for AirCare 
        vm.airCareList = [
              { value: 'AirCare', name: 'AirCare' }
        ];

        //hard coded package for ExactCare 
        vm.exactCareList = [
              { value: 'ExactCare', name: 'ExactCare' }
        ];

        //load TODOItems from todoService ...
        vm.loadTodos = function () {
            return todoService.getTodos();
        };

    }
})();