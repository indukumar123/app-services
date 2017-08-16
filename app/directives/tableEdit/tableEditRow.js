(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('tableEditRow', ['$compile', tableEditRowDirective]);

    function tableEditRowDirective($compile) {

        function linker(scope, element, attrs) {
            var template = "";
            var columnDefs = scope.vm.headerDefinition;
            var fieldTypes = scope.vm.fieldTypes;

            columnDefs.forEach(function (column, index) {
                var html = "";

                html += '<div style="flex: ' + column.width + ';" class="table-cell bordered-cell">';

                if (column.fieldType !== fieldTypes.link) {
                    html += '<span ng-class="{disabled: vm.cellShouldBeDisabled(' + index + ', vm.rowIndex)}" class="placeholder" ng-click="vm.placeholderClicked($event,' + index + ', vm.rowIndex)" >{{vm.row.data[\'' + column.bhtpModel + '\']}}</span>';
                }
                else {
                    html += '<span ng-if="!vm.row.data[\'' + column.bhtpModel + '\']" class="disabled placeholder"></span>';
                    html += '<a ng-if="vm.row.data[\'' + column.bhtpModel + '\'] && vm.row.data[\'' + column.bhtpModel + '\'].href" ng-href="{{vm.row.data[\'' + column.bhtpModel + '\'].href}}" class="placeholder">{{vm.row.data[\'' + column.bhtpModel + '\'].display}}</a>';
                }
               
                html += '</div>';

                template += html;
            });

            element.html(template);
            $compile(element.contents())(scope);
        }

        return {
            restrict: 'E',
            scope: {
                row: "=",
                headerDefinition: "=",
                rowIndex: "=",
                cellShouldBeDisabled: "=",
                placeholderClicked: "=",
                cellFocused: "=",
                cellChanged: "=",
                cellBlurred: "=",
                fieldTypes: "=",
            },
            controller: tableEditRowDirectiveCtrl,
            controllerAs: 'vm',
            bindToController: true,
            link: linker,
        };
    }

    tableEditRowDirectiveCtrl.$inject = [];
    function tableEditRowDirectiveCtrl() {
        var vm = this;

        /**
         * @description
         * 
         */
        function init() {
        }

        init();
    }
})();