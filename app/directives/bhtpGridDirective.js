(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpGrid
     *
     * # bhtpGrid
     *
     * @description
     * generci grid directive for various grid featuring on dashbaord, customers, qutoes and policies type pages
     */
    angular.module('agentPortal')
        .directive('bhtpGridDirective', ['$q', 'portalService', bhtpGridDirective]);

    angular.module('agentPortal')
        .controller('bhtpGridController', bhtpGridController);

    bhtpGridController.$inject = ['$scope', '$interpolate'];
    function bhtpGridController($scope, $interpolate) {
                $scope.hrefCompiled = function (action, row) {
                    if (action.disabled)
                        return '';

                    if (action.href)
                        return $interpolate(action.href)({ row: row });

                    return '';
                };

                $scope.uisrefCompiled = function (action, row) {
                    if (action.disabled)
                        return '';

                    if (action.uisref)
                        return $interpolate(action.uisref)({ row: row });

                    return '';
                };
    }

    function bhtpGridDirective($q, portalService, atts) {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                grid: '=',
                gridConfig: '=',
                searchText: '=',
                refreshDataFlag: '=',
                reloadDataFlag: '=',
                selected: '=',
                loadData: '&',
                customFilters: '&',
                pageSize: '=?bind'
            },
            templateUrl: 'app/layout/grid.html',
            controller: 'bhtpGridController',
            link: function (scope, element, attrs) {
                var unFilteredRows = [];
                scope.searchText = '';

                scope.totalRecords = 0;
                scope.currentPage = 1;

                scope.orderby = '';
                scope.reverse = false;

                scope.rows = [];
                scope.selected = [];

                scope.agent = {};

                //load data whenever reloadDataFlag is updated
                scope.$watch('reloadDataFlag', function (newValue, oldValue) {
                    if (newValue == true) {
                        scope.reloadDataFlag = false;
                        loadData();
                    }
                });

                //watch whenever refresh is required
                scope.$watch('refreshDataFlag', function (newValue, oldValue) {
                    if (newValue == true) {
                        loadData();
                        scope.refreshDataFlag = false;
                    }
                });

                function init() {
                    var promises = [];

                    promises.push(portalService.getAgentByInternalId().then(function (agent) {
                        scope.agent = agent;
                    }));

                    if (!scope.pageSize) {
                        promises.push(portalService.loadConfig().then(function (config) {
                            scope.pageSize = parseInt(config.CLIENT_GRID_PAGE_SIZE);
                        }));
                    }

                    $q.all(promises).then(function () {
                    scope.reverse = scope.gridConfig.defaultOrder;
                    scope.rowIdentifier = scope.gridConfig.rowIdentifier;
                    scope.gridConfig.orderby = scope.gridConfig.defaultOrderBy;
                    scope.gridConfig.currentPage = 1;
                    scope.gridConfig.reverse = scope.reverse;
                    loadData();
                    });
                }

                function loadData() {
                    scope.loadData().then(function (results) {
                        unFilteredRows = results;
                        refreshData();
                    });
                }

                /**
                 * @description
                 * refreshes grid data
                 */
                function refreshData() {
                    var config = getConfig();

                    if (config.order && config.order.column == "") {
                        config.order.column = scope.gridConfig.defaultOrderBy;
                    }

                    var newRows = unFilteredRows.sort(dynamicSort(config.order));

                    var returnData = null;

                    //Get Display Information
                    scope.totalRecords = scope.gridConfig.totalRecords;


                    if (scope.$eval(attrs.onlyActiveFlag)) {
                        scope.message = "Active Policies";
                    }
                    else {
                        if (scope.gridConfig.dateSelected == null || scope.gridConfig.dateSelected.startDate == null || scope.gridConfig.dateSelected.endDate == null) {
                            scope.message = "";
                        }
                        else {
                            scope.message = "Selected Date Range :" + scope.gridConfig.dateSelected.startDate + ' - ' + scope.gridConfig.dateSelected.endDate;
                        }
                    }

                    if (returnData == null || returnData.dateSelected.startDate == null || returnData.dateSelected.endDate == null) {
                        scope.message = "";
                    }
                    else {
                        scope.message = "Selected Date Range :" + returnData.dateSelected.startDate + ' - ' + returnData.dateSelected.endDate;
                    }

                    if (newRows.length > config.page.size) {
                        var firstRecordIndex = (config.page.current * config.page.size) - config.page.size;
                        newRows = newRows.slice(firstRecordIndex, firstRecordIndex + config.page.size);
                    }

                    //Get the rows for display only for server side paging
                    scope.rows = newRows;
                }

                /**
                 * @description
                 * initializes configuration for the grid
                 */
                function getConfig() {
                    var config = {
                        page: { current: scope.currentPage, size: scope.pageSize },
                        filter: { text: scope.searchText },
                        order: { column: scope.orderby, reverse: scope.reverse }
                    };

                    var filters = scope.customFilters();
                    if (filters) {
                        for (var i = 0; i < filters.length; i++) {
                            var filter = filters[i];
                            config.filter[filter.key] = filter.value;
                        }
                    }
                    return config;
                }

                /**
                  * @description
                  * filter change event, causes data to be refreshed and pagination set to 1 
                  */
                scope.filterChanged = function () {
                    scope.currentPage = 1;

                    if (scope.agent.isSuperUser) {
                        loadData();
                    }
                    else {
                        refreshData();
                    }
                };

                /**
                  * @description
                  * refreshes data when page selection changes
                  */
                scope.pageChanged = function () {
                    scope.gridConfig.currentPage = scope.currentPage;
                    loadData();
                };

                /**
                  * @description
                  * refreshes grid data when ordering is changed by the user
                  */
                scope.orderChanged = function (newOrderBy) {
                    if (newOrderBy === scope.orderby) {
                        scope.reverse = !scope.reverse;
                    }
                    scope.orderby = newOrderBy;

                    scope.gridConfig.reverse = scope.reverse;
                    scope.gridConfig.orderby = newOrderBy;
                    loadData();
                };

                /**
                  * @description
                  * sorts the grid data
                  */
                function dynamicSort(sortConfig) {
                    var property = sortConfig.column;
                    var sortOrder = sortConfig.reverse ? -1 : 1;
                    var getResults = function (firstValue, secondValue) {
                        if (firstValue == null || firstValue == "")
                            return -1;
                        if (secondValue == null || secondValue == "")
                            return 1;

                        if (typeof firstValue == "string") {
                            firstValue = firstValue.toLowerCase();
                            secondValue = secondValue.toLowerCase();
                        }

                        return (firstValue < secondValue) ? -1 : (firstValue > secondValue) ? 1 : 0;
                    };

                    return function (first, second) {
                        var firstValue = scope.getProperty(first, property);
                        var secondValue = scope.getProperty(second, property);
                        return getResults(firstValue, secondValue) * sortOrder;
                    };
                }

                /**
                  * @description
                  * returns true is given row is selected on the grid
                  */
                scope.isSelected = function (row) {
                    return scope.selected.indexOf(row[scope.rowIdentifier]) >= 0;
                };

                /**
                  * @description
                  * returns styling information for the grid cell in form of css class name
                  */
                scope.getCellClass = function (cell) {
                    var className = "";
                    if (cell.isCurrency) {
                        return "text-right";
                    }

                    if (cell.showAsLink) {
                        return "span-link";
                    }

                    return className;
                };

                /**
                  * @description
                  * returns styling information for the grid cell in form of in-line style
                  */
                scope.getCellStyle = function (cell) {
                    var styleName = "";
                    if (cell.preferredWidth != null) {
                        return "width:" + cell.preferredWidth;
                    }
                    return styleName;
                };

                /**
                  * @description
                  * updates selected rows on teh grid
                  */
                function updateSelected(action, row) {
                    var id = row[scope.rowIdentifier];
                    var isSelected = scope.isSelected(row);

                    if (action === 'add' && !isSelected) {
                        scope.selected.push(id);
                    }
                    if (action === 'remove' && isSelected) {
                        scope.selected.splice(scope.selected.indexOf(id), 1);
                    }
                }

                scope.updateSelection = function ($event, row) {
                    var checkbox = $event.target;
                    var action = (checkbox.checked ? 'add' : 'remove');
                    updateSelected(action, row);
                };

                /**
                  * @description
                  * selects all the rows
                  */
                scope.selectAll = function ($event) {
                    var checkbox = $event.target;
                    var action = (checkbox.checked ? 'add' : 'remove');
                    for (var i = 0; i < scope.rows.length; i++) {
                        var entity = scope.rows[i];
                        updateSelected(action, entity);
                    }
                };

                /**
                  * @description
                  * provides styling for selected row
                  */
                scope.getSelectedClass = function (entity) {
                    return scope.isSelected(entity) ? 'selected' : '';
                };

                /**
                  * @description
                  * returns true if all rows are selected
                  */
                scope.isSelectedAll = function () {
                    if (scope.rows.length == 0) return false;

                    for (var i = 0; i < scope.rows.length; i++) {
                        if (!scope.isSelected(scope.rows[i]))
                            return false;
                    }
                    return true;
                };

                /**
                  * @description
                  * retrieves grid cell's value
                  */
                scope.getProperty = function (json, path) {
                    var tokens = path.split(".");
                    var obj = json;
                    for (var i = 0; i < tokens.length; i++) {
                        if (obj) {
                            obj = obj[tokens[i]];
                        }
                    }
                    if (obj == null || obj.toString().length == 0) {
                        obj = "-";
                    }
                    return obj;
                };

                /**
                  * @description
                  * returns filter for given column
                  */
                scope.getFilter = function (json, path, column) {
                    var filter = '';
                    var obj = json;
                    for (var i = 0; i < tokens.length; i++) {
                        obj = obj[tokens[i]];
                    }
                    if (obj != null && obj.toString().length > 0) {
                        filter = 'useFilter:' + column.filter + ':' + column.filterParam;
                    }
                    return filter;
                };

                scope.getFilterBinding = function (json, column) {
                    var filter = column.filterParam;
                    if (column.filterBinding) {
                        var tokens = column.filterBinding.split(".");
                        var obj = json;
                        for (var i = 0; i < tokens.length; i++) {
                            obj = obj[tokens[i]];
                        }
                        if (obj !== null && obj.toString().length > 0) {
                            filter = obj;
                        }
                    }
                    
                    return filter;
                }

                /**
                  * @description
                  * returns sort class for given column
                  */
                scope.getHeaderClass = function (column) {
                    if (scope.orderby == column.binding || scope.orderby + '.localDate' == column.binding) {
                        if (scope.gridConfig.reverse) {
                            return 'fa fa-angle-down'
                        }
                        else {
                            return 'fa fa-angle-up'
                        }
                    }
                    else {
                        return '';
                    }

                }

                scope.columnClicked = function (row, column) {
                    if (typeof column.click === "function") {
                        column.click(row);
                    }
                }

                init();
            }
        };
    }
})();