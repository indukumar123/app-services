(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('tableEdit', [tableEditDirective]);

    function tableEditDirective() {
        return {
            restrict: 'E',
            scope: {
                config: "=",
                contentTemplate: "=",
                rows: "=",
                control: "=",
                newRowCallback: "=",
                tableReady: "=",
                onRowBlurred: "=",
                onCellBlurred: "="
            },
            templateUrl: 'app/directives/tableEdit/tableEdit.html',
            controller: tableEditDirectiveCtrl,
            controllerAs: 'vm',
            bindToController: true,
        };
    }

    tableEditDirectiveCtrl.$inject = ['tableHelper'];
    function tableEditDirectiveCtrl(tableHelper) {
        var vm = this;
        var fontWidthInPx = 8;
        var msOffset = 2;
        var initialHoverState = -1;
        var initialPendingDeleteState = -1;
        var currentTargetRow;
        var scrollEvent;

        vm.modelOptions = {
            debounce: 150
        };

        vm.currentEditRowIndex = 0;

        vm.fieldTypes = {
            text: "text",
            dropdown: "dropdown",
            number: "number",
            decimal: "decimal",
            date: "date",
            phonenumber: "phonenumber",
            typeahead: "typeahead",
            link: "link",
            calculated: "calculated"
        };

        vm.groups = [];
        vm.headers = [];
        vm.currentHoverIndex = initialHoverState;
        vm.pendingDelete = initialPendingDeleteState;
        vm.phoneMask = "(999) 999-9999";
        vm.dateMask = "mm/dd/yyyy";

        vm.currentSortColumn = null;
        vm.currentSortDesc = false;

        vm.cellFocused = function (cellIndex, rowIndex) {
            // if user clicks in last row, add new, empty row below it
            if (rowIndex + 1 === vm.rows.length) {
                addNewRow();
            }
        };

        vm.placeholderClicked = function ($event, cellIndex, rowIndex) {
            if (!vm.rowShouldBeDisabled(rowIndex)) {
                vm.currentEditRowIndex = rowIndex;
                currentTargetRow = $($event.target).closest(".table-row");

                updateFloaterRowPosition();
                var tableEntry = currentTargetRow.closest(".entry-table");
                var floatingRow = $(".table-row.floating", tableEntry);

                // we only want to bind this event once, so check the global reference to see if it was set yet
                if (!scrollEvent) {
                    floatingRow.css({ "display": "flex" });
                    scrollEvent = tableEntry.scroll(function () {
                        updateFloaterRowPosition();
                    });
                    $(window).scroll(function () {
                        updateFloaterRowPosition();
                    });
                }

                var cells = $(".table-cell", floatingRow);
                if (cells.length > cellIndex) {
                    var targetCell = cells[cellIndex];
                    var targetInput = $("input.basic", targetCell);
                    if (targetInput) {
                        targetInput.focus();
                    }
                }
            }
        };

        function updateFloaterRowPosition() {
            if (currentTargetRow) {
                var floatingRow = $(".table-row.floating", currentTargetRow.closest(".entry-table"));
                var targetOffset = currentTargetRow.offset();
                floatingRow.offset(targetOffset);
            }
        }

        // update the cell hash when the value changes
        vm.cellChanged = function (cellIndex, rowIndex) {
            var row = vm.rows[rowIndex];
            var property = vm.headers[cellIndex].bhtpModel;
            var cellValue = row.data[property];

            row.hash[property] = tableHelper.getFieldHash(cellValue);
        };

        vm.cellBlurred = function (cellIndex, rowIndex) {
            // for now, call row blur events instead of checking of the target
            // is within the same row
            if (vm.onRowBlurred && typeof vm.onRowBlurred === "function") {
                vm.onRowBlurred(getBlurEventRow(rowIndex), rowIndex);
            }

            if (vm.onCellBlurred && typeof vm.onCellBlurred === "function") {
                vm.onCellBlurred(rowIndex, vm.headers[cellIndex]);
            }
        };

        // check if an individual cell should be disabled
        vm.cellShouldBeDisabled = function (cellIndex, rowIndex) {
            var shouldBeDisabled = false;

            shouldBeDisabled = (vm.headers[cellIndex] && vm.headers[cellIndex].fieldType === "calculated") ||
                (vm.rowShouldBeDisabled(rowIndex) && (!vm.headers[cellIndex] || vm.headers[cellIndex] !== vm.fieldTypes.link));
            
            return shouldBeDisabled;
        }

        // check if an entire row should be disabled
        vm.rowShouldBeDisabled = function (rowIndex) {
            var shouldBeDisabled = false;

            if (vm.rows) {
                var indexToCheck = rowIndex - 1;
                var isLastRow = rowIndex + 1 === vm.rows.length;

                if (vm.rows[rowIndex] && vm.rows[rowIndex].readOnly) {
                    shouldBeDisabled = true;
                } else if (isLastRow && vm.rows[indexToCheck] && !tableHelper.rowIsPopulated(vm.rows[indexToCheck])) {
                    shouldBeDisabled = true;
                }
            }

            return shouldBeDisabled;
        };

        vm.hoverOnRow = function (rowIndex) {
            vm.currentHoverIndex = rowIndex;
        };

        vm.hoverOffRow = function () {
            vm.currentHoverIndex = initialHoverState;
        };

        vm.showDeleteIcon = function (rowIndex) {
            return shouldShowDeleteIcon(rowIndex);
        };

        vm.showLineNumber = function (rowIndex) {
            return !shouldShowDeleteIcon(rowIndex);
        };

        vm.hasErrors = function (rowIndex) {
            return shouldShowErrorIcon(rowIndex);
        };

        // when user clicks delete on row, ask them if they actuall meant that
        vm.promptDelete = function (rowIndex) {
            if (vm.canDeleteRows() && !vm.rowShouldBeDisabled(rowIndex)) {
                if (tableHelper.rowIsPopulated(vm.rows[rowIndex])) {
                    vm.pendingDelete = rowIndex;
                    openDeleteModal();
                } else {
                    vm.removeRow(rowIndex);
                }
            }
        };

        vm.removeRow = function (rowIndex) {
            if (vm.canDeleteRows()) {
                if (rowIndex >= 0 && rowIndex < vm.rows.length) {
                    vm.rows.splice(rowIndex, 1);
                    if (vm.rows.length <= 0) {
                        addNewRow();
                    }
                }
            }
        };

        // show user list of field and API errors associated with the row
        vm.showErrors = function (rowIndex) {
            if (vm.hasErrors(rowIndex)) {
                openErrorsModal(rowIndex);
            }
        };

        vm.columnIsFieldType = function (columnIndex, fieldType) {
            var column = vm.headers[columnIndex];

            if (column) {
                return column.fieldType === fieldType;
            }

            return false;
        };

        // limit cell input to integers
        vm.numberOnKeyPress = function numberOnKeyPress(event) {
            if (!isADigit(event.key)) {
                event.preventDefault();
            }
        };

        // limit decimals to 2 decimal places
        vm.decimalOnKeyPress = function decimalOnKeyPress(event, cellIndex, rowIndex) {
            var cellValue = getCellValue(cellIndex, rowIndex);
            var attemptedValue = cellValue + event.key;

            var reg = /^\d*(?:\.\d{0,2})?$/;
            var matchingValue = attemptedValue.match(reg)
            if (matchingValue) {
                setCellValue(cellIndex, rowIndex, matchingValue[0]);
            } else {
                setCellValue(cellIndex, rowIndex, cellValue);
            }
            event.preventDefault();
        };

        vm.sortColumn = function (columnToSort) {
            if (columnToSort === vm.currentSortColumn) {
                vm.currentSortDesc = !vm.currentSortDesc;
            }
            else {
                vm.currentSortDesc = false;
            }

            vm.currentSortColumn = columnToSort;

            // don't sort the last row if it's blank
            var rowsToSort = [];
            var lastRow = null;
            for (var i = 0; i < vm.rows.length; i++) {
                var isLastRow = i === vm.rows.length - 1;
                if (!isLastRow || (vm.rows[i] && tableHelper.rowIsPopulated(vm.rows[i]))) {
                    rowsToSort.push(vm.rows[i]);
                }
                else {
                    lastRow = vm.rows[i];
                }
            }

            rowsToSort.sort(sortData());
            vm.rows = rowsToSort;

            // if the last row was blank, add that to the end
            if (lastRow !== null) {
                vm.rows.push(lastRow);
            }
        };

        function sortData() {
            var property = vm.currentSortColumn;
            var sortOrder = 1;
            if (vm.currentSortDesc) {
                sortOrder = -1;
            }
            return function (a, b) {
                var result = (a.data[property] < b.data[property]) ? -1 : (a.data[property] > b.data[property]) ? 1 : 0;
                return result * sortOrder;
            }
        }

        // get the class to apply to column headers for sort icons
        vm.getHeaderClass = function (columnModel) {
            if (columnModel === vm.currentSortColumn) {
                if (vm.currentSortDesc) {
                    return 'fa fa-angle-down'
                }
                else {
                    return 'fa fa-angle-up'
                }
            }
            
            return '';
        };

        vm.canAddRows = canAddRows;
        vm.canDeleteRows = canDeleteRows;

        function canAddRows() {
            return vm.config && vm.config.canAddRows;
        }

        function canDeleteRows() {
            return vm.config && vm.config.canDeleteRows;
        }

        function isADigit(value) {
            var reg = /^\d$/;
            return reg.test(event.key);
        }

        function init() {
            if (vm.control) {
                vm.control.getNewRow = getNewRow;
                vm.control.insertRowsIntoTableRows = insertRowsIntoTableRows;
                vm.control.updateTemplate = function (newTemplate) {
                    vm.contentTemplate = newTemplate;
                    prepareBuilderObjects();
                };
            }

            if (vm.contentTemplate) {
                prepareBuilderObjects();
            }

        }

        function getCellValue(cellIndex, rowIndex) {
            var row = vm.rows[rowIndex];
            var property = vm.headers[cellIndex].bhtpModel;
            var cellValue = row.data[property];

            return cellValue;
        }

        function setCellValue(cellIndex, rowIndex, value) {
            var row = vm.rows[rowIndex];
            var property = vm.headers[cellIndex].bhtpModel;

            row.data[property] = value;
        }

        function shouldShowDeleteIcon(rowIndex) {
            return vm.canDeleteRows() && vm.currentHoverIndex === rowIndex && !vm.rowShouldBeDisabled(rowIndex);
        }

        function shouldShowErrorIcon(rowIndex) {
            if (vm.rows[rowIndex]) {
                if (tableHelper.hasFieldErrors(vm.rows[rowIndex])) {
                    return true;
                }

                if (vm.rows[rowIndex].apiErrors && vm.rows[rowIndex].apiErrors.length > 0) {
                    return true;
                }
            }

            return false;
        }

        function prepareBuilderObjects() {
            vm.groups = getGroupArray();
            vm.headers = getHeadersArray();

            if (typeof vm.tableReady === "function") {
                vm.tableReady();
            }

            if (vm.rows && vm.rows.length <= 0) {
                addNewRow();
            }
        }

        function getGroupArray() {
            var groups = [];

            // determine the width of each group of columns on the grid
            vm.contentTemplate.groups.forEach(function (group) {
                var width = 0;
                var msWidth = -1 * msOffset;
                group.columns.forEach(function (column) {
                    width += column.charWidth * fontWidthInPx;
                    msWidth += column.charWidth * fontWidthInPx + msOffset;
                });

                groups.push({
                    label: group.label,
                    width: "0 0 " + width + "px",
                    msWidth: "0 0 " + msWidth + "px"
                });
            });

            return groups;
        }

        function getHeadersArray() {
            var headers = [];
            var ignoreList = ['charWidth'];

            // determine the width of each header column
            vm.contentTemplate.groups.forEach(function (group) {
                group.columns.forEach(function (column) {
                    var width = 0;
                    var header = {};

                    width += column.charWidth * fontWidthInPx;

                    for (var property in column) {
                        if (column.hasOwnProperty(property)) {
                            if (!tableHelper.stringInList(property, ignoreList) && !header.hasOwnProperty(property)) {
                                header[property] = column[property];
                            }
                        }
                    }

                    header.width = "0 0 " + width + "px";
                    header.group = group;

                    headers.push(header);
                });
            });

            return headers;
        }

        function getBlurEventRow(rowIndex) {
            var ignoreList = ['width'];
            var row = JSON.parse(JSON.stringify(vm.rows[rowIndex]));
            var counter = 0;
            
            // find the property that matches the blurred cell
            for (var property in row.data) {
                if (row.data.hasOwnProperty(property)) {
                    var column = {
                        value: row.data[property],
                        hash: row.hash[property],
                    };

                    var columnDefinition = vm.headers[counter];

                    for (var headerProperty in columnDefinition) {
                        if (columnDefinition.hasOwnProperty(headerProperty) && !tableHelper.stringInList(headerProperty, ignoreList)) {
                            column[headerProperty] = columnDefinition[headerProperty];
                        }
                    }

                    // set the new value in the backing data
                    row.data[property] = column;
                    counter++;
                }
            }

            delete row.hash;

            return row;
        }

        function addNewRow(rowTarget) {
            if (vm.canAddRows()) {
                var entryCollection = rowTarget || vm.rows;
                var newRow = getNewRow();

                if (typeof vm.newRowCallback === "function") {
                    newRow = vm.newRowCallback(newRow);
                }

                insertRowsIntoTableRows([newRow], entryCollection, getNewRow());
            }
        }

        function getNewRow() {
            var newRow = {
                "data": {},
                "hash": {}
            };

            vm.contentTemplate.groups.forEach(function (group) {
                group.columns.forEach(function (column) {
                    newRow.data[column.bhtpModel] = "";
                    newRow.hash[column.bhtpModel] = "";
                });
            });

            return newRow;
        }

        function insertRowsIntoTableRows(rows, targetRows, newRowTemplate) {
            //Server returns data properties sorted alphabetically, so we need to order it as specified by the template
            rows.forEach(function (row, index) {
                var newRow = JSON.parse(JSON.stringify(newRowTemplate));

                //Loop through and grab any metadata for the row
                for (var property in row) {
                    if (row.hasOwnProperty(property)) {
                        if (!newRow.hasOwnProperty(property)) {
                            newRow[property] = row[property];
                        }
                    }
                }

                //Loop through and populate the data
                for (var property in newRow.data) {
                    var sourceData = row.data[property];
                    if (newRow.data.hasOwnProperty(property)) {
                        if (sourceData !== null && sourceData !== undefined) {
                            newRow.data[property] = sourceData;
                        }
                        newRow.hash[property] = tableHelper.getFieldHash(newRow.data[property]);
                    }
                }

                newRow.uniqueId = (Math.random() * 1000000000000000000) + "";

                // copy over any errors from the source row to the new row
                if (newRow.data && row.data && row.data.errors) {
                    newRow.data.errors = row.data.errors;
                }

                targetRows.push(newRow);
            });

            if (targetRows.length <= 0) {
                addNewRow(targetRows);
            }
        }

        function openDeleteModal() {
            $("#confirmDelete").modal("show");
        }

        function openErrorsModal(rowIndex) {
            vm.errorRowIndex = rowIndex;
            $("#errorsModal").modal("show");
        }

        init();
    }
})();