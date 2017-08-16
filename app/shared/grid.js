/**
 * @ngdoc function
 * @name Grid
 *
 * # Grid
 *
 * @description
 * generic Grid feature implementation,  i.e., used by grid directive
 */

function Grid(callback, gridConfig) {
    this.callback = callback;

    this.searchText = '';

    this.totalRecords = 0;
    this.pageSize = 10;
    this.currentPage = 1;

    this.orderby = '';
    this.reverse = false;

    this.unFilteredRows = [];
    this.rows = [];
    this.selected = [];

    /**
     * @description
     * grid implementation - initialization
     */
    this.init = function () {
        this.orderby = gridConfig.defaultOrderBy;
        this.reverse = gridConfig.defaultOrder;
        this.loadData();
    };

    /**
     * @description
     * grid implementation - load data for the rows
     */
    this.loadData = function () {
        var grid = this;

        this.callback.loadData().then(function (results) {
            grid.unFilteredRows = results;
            grid.reloadData();
        });
    };

    /**
     * @description
     * grid implementation - reload data from scratch
     */
    this.reloadData = function () {
        var config = this.getConfig();

        var newRows = this.unFilteredRows.sort(this.dynamicSort(config.order));

        newRows = gridConfig.filter(newRows, config.filter);
        this.totalRecords = newRows.length;

        var startIndex = (config.page.current - 1) * config.page.size;
        var endIndex = startIndex + config.page.size;

        this.rows = newRows.slice(startIndex, endIndex);
    };

    /**
     * @description
     * grid implementation - configuration
     */
    this.getConfig = function () {
        var config = {
            page: {
                current: this.currentPage,
                size: this.pageSize
            },
            filter: {
                text: this.searchText
            },
            order: {
                column: this.orderby,
                reverse: this.reverse
            }
        };

        if (this.callback.getCustomFilters) {
            var filters = this.callback.getCustomFilters();
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                config.filter[filter.key] = filter.value;
            }
        }
        return config;
    };

    /**
     * @description
     * grid implementation - filter change event handling
     */
    this.filterChanged = function () {
        this.currentPage = 1;
        this.reloadData();
    };

    /**
     * @description
     * grid implementation - pagination support, handles page-changed events and refreshes data when user navigates to other pages
     */
    this.pageChanged = function (page) {
        this.currentPage = page;
        this.reloadData();
    };

    /**
     * @description
     * grid implementation - sorting - when user clicks on column headers to sort grid data
     */
    this.orderChanged = function (orderby) {
        if (orderby === this.orderby) {
            this.reverse = !this.reverse;
        }
        this.orderby = orderby;
        this.reloadData();
    };

    /**
     * @description
     * grid implementation - dynamic softing
     */
    this.dynamicSort = function (sortConfig) {
        var property = sortConfig.column;
        var sortOrder = sortConfig.reverse ? -1 : 1;

        return function (a, b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        };
    };

    /**
     * @description
     * grid implementation - tracks selected rows on the grid
     */
    this.updateSelected = function (action, id) {
        if (action === 'add' && this.selected.indexOf(id) === -1) {
            this.selected.push(id);
        }
        if (action === 'remove' && this.selected.indexOf(id) !== -1) {
            this.selected.splice(this.selected.indexOf(id), 1);
        }
    };

    /**
     * @description
     * grid implementation - tracks row selection events
     */
    this.updateSelection = function ($event, id) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        this.updateSelected(action, id);
    };

    /**
     * @description
     * grid implementation - selects all the rows
     */
    this.selectAll = function ($event) {
        var checkbox = $event.target;
        var action = (checkbox.checked ? 'add' : 'remove');
        for (var i = 0; i < this.rows.length; i++) {
            var entity = this.rows[i];
            this.updateSelected(action, entity.id);
        }
    };

    /**
     * @description
     * retruns styling related information for selected rows
     */
    this.getSelectedClass = function (entity) {
        return this.isSelected(entity.id) ? 'selected' : '';
    };

    /**
     * @description
     * returns true if row identified by id is selected
     */
    this.isSelected = function (id) {
        return this.selected.indexOf(id) >= 0;
    };

    /**
     * @description
     * returns true if all the rows are selected by the user
     */
    this.isSelectedAll = function () {
        return this.rows.length > 0 && this.selected.length === this.rows.length;
    };

    /**
     * @description
     * grid implementation - clears selections on the grid
     */
    this.clearSelections = function () {
        this.selected = [];
    };
}