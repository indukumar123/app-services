(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name policyUploadDetailsController
     *
     *
     *
     * @description
     * controller for agents to view details on a policy that has been uploaded.
     */
    angular.module('agentPortal')
            .controller('policyUploadDetailsController', ['nonMerchantPolicies', '$q', '$stateParams', 'format', '$window', policyUploadDetailsController]);
    function policyUploadDetailsController(nonMerchantPolicies, $q, $stateParams, format, $window) {
        var vm = this;
        var window = angular.element($window);

        // The number of rows to show on initial page load.
        vm.defaultRows = 100;

        // Initial details for the pagination
        vm.paginationDetails = {
            maxSize: 0,
            itemsPerPage: vm.defaultRows,
            model: 1,
            totalItems: 0
        };

        // On page load errors and valid uploads will be shown
        vm.errorsOnly = false;

        // Instasiating to fill when a user clicks to see error info it will be filled
        vm.errorInformation = {};

        // Flag to show error info
        vm.showErrorInfo = false;

        // Flag used to determine if scrolling should be enabled.
        vm.scrollDisabled = false;

        // Minimum number of rows to display
        vm.minRows = 5;

        // Button text to view all rows on initial load
        vm.columnDisplayText = 'Show all columns';

        // Do not show all columns on initial load.
        vm.allColumns = false;

        // Default that the grid will be sorted by on page load.
        vm.sortGridBy = [{ header: "CSV Row Number", binding: "csvRowNumber", addToSort: true, sortDesc: false, alwaysShow: true }];

        // Column headers for the grid with properties to do calculations on.
        vm.columns = [
                { header: "CSV Row Number", binding: "csvRowNumber", addToSort: true, sortDesc: false, alwaysShow: true },
                { header: "Policy Number", binding: "policyNumber", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Location Number", binding: "locationNumber", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "First Name", binding: "firstName", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Last Name", binding: "lastName", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Product Code", binding: "productCode", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Premium Rcvd Date", binding: "premiumRcvdDate", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Departure Date", binding: "departureDate", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Return Date", binding: "returnDate", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Use Yr", binding: "useYr", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Use Yr Start Date", binding: "useYrStartDate", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Total Trip Cost", binding: "totalTripCost", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Address", binding: "address", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "City", binding: "city", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "State", binding: "state", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Postal Code", binding: "zip", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Country", binding: "country", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Phone", binding: "phone", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Email", binding: "email", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Date Of Birth", binding: "dateOfBirth", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Destination", binding: "destination", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Agent Code", binding: "agentCode", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Member Num", binding: "memberNum", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Res ID", binding: "resID", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Invoice No", binding: "invoiceNo", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Gross Prem", binding: "grossPrem", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Net Paid", binding: "netPaid", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Amnt Kept", binding: "amntKept", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Marketing", binding: "marketing", addToSort: false, sortDesc: false, alwaysShow: false },
                { header: "Action Code", binding: "actionCode", addToSort: false, sortDesc: false, alwaysShow: true },
                { header: "Referring Agent", binding: "referralId", addToSort: false, sortDesc: false, alwaysShow: true }
        ];

        // Loads the page and grid information
        function init() {
            vm.getPolicyPaginationDetail(vm.paginationDetails.model, vm.paginationDetails.itemsPerPage, formatGridSort(vm.sortGridBy), vm.errorsOnly);
            vm.calculateTableOverallDisplay();
        }

        // Formats the pagination tool to display properly.
        function formatPagination(policyDetails) {
            vm.paginationDetails.maxSize = 10;
            vm.paginationDetails.itemsPerPage = policyDetails.numberOfItemsPerPage;
            vm.paginationDetails.model = policyDetails.currentPage;
            vm.paginationDetails.totalItems = policyDetails.totalItems;
        }

        // Removes a column from sorting.
        function removeFromGridSort(column) {
            if (vm.sortGridBy && vm.sortGridBy.length > 0) {
                for (var i = 0; i < vm.sortGridBy.length; i++) {
                    if (vm.sortGridBy[i].binding == column.binding) {
                        vm.sortGridBy.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Formats the string to be sent in api for sorting the grid.
        function formatGridSort() {
            var apiSortString = "";
            if (vm.sortGridBy && vm.sortGridBy.length > 0) {
                for (var i = 0; i < vm.sortGridBy.length; i++) {
                    if (i == 0) {
                        apiSortString = vm.sortGridBy[i].sortDesc ? "-" + vm.sortGridBy[i].binding : vm.sortGridBy[i].binding;
                    } else {
                        apiSortString += ",";
                        apiSortString += +vm.sortGridBy[i].sortDesc ? "-" + vm.sortGridBy[i].binding : vm.sortGridBy[i].binding;
                    }
                }
            } else {
                apiSortString = "CSVRowNumber";
            }
            return apiSortString;
        }

        // Formats the PremiumRcvdDate and ReturnDate to display in local time.
        function formatTimeResults(uploadList) {
            for (var i = 0; i < uploadList.pagedItems.length; i++) {
                uploadList.pagedItems[i].premiumRcvdDate = format.getLocalDateFromUTC(uploadList.pagedItems[i].premiumRcvdDate, 'M/D/YYYY');

                uploadList.pagedItems[i].returnDate = format.getLocalDateFromUTC(uploadList.pagedItems[i].returnDate, 'M/D/YYYY');
            }
            return uploadList;
        }

        function calcualteTableDisplayHeight() {
            var tableHeight = window.height() * 0.7;
            return tableHeight;
        }

        // Calculates the min and max height for the table based on the window size for scrollable windows.
        window.bind('resize', function () {
            vm.calculateTableOverallDisplay();
        });

        vm.calculateTableOverallDisplay = function calculateTableOverallDisplay() {
            if (!vm.scrollDisabled) {
                var tableHeight = calcualteTableDisplayHeight();
                $("#uploadDetails").css({ "max-height": (tableHeight + "px"), "overflow":"auto" });
            } else {
                $("#uploadDetails").removeAttr('style');
            }
        }

        // Gets the policy upload details
        vm.getPolicyPaginationDetail = function getPolicyPaginationDetail(pageNumber, rowsPerPage, sortBy, errorsOnly) {
            var uploadId = $stateParams.uploadId;

            var deferredPromise = $q.defer();
            nonMerchantPolicies.getPolicyPaginationDetail(uploadId, pageNumber, rowsPerPage, sortBy, errorsOnly).then(function (result) {
                vm.policyDetails = formatTimeResults(result);
                formatPagination(vm.policyDetails);
                deferredPromise.resolve(result);
            });
            return deferredPromise.promise;
        }

        // Gets the new data to show user when the next page is clicked
        vm.paginationChanged = function paginationChanged() {
            if (vm.paginationDetails.itemsPerPage >= vm.minRows) {
                vm.getPolicyPaginationDetail(vm.paginationDetails.model, vm.paginationDetails.itemsPerPage, formatGridSort(vm.sortGridBy), vm.errorsOnly);
            }
        }

        // Modifys the sortGridBy object and sorts grid
        vm.changeGridSortBindings = function changeGridSortBindings(column) {
            column.addToSort = !column.addToSort;
            if (column.addToSort) {
                vm.sortGridBy.push(column);
            } else {
                removeFromGridSort(column);
            }
            vm.paginationChanged();
        }

        // Sets whether the grid header that is sorted is being sorted Asc or Desc
        vm.toggleDesc = function toggleDesc(column) {
            column.sortDesc = !column.sortDesc;
            if (vm.sortGridBy && vm.sortGridBy.length > 0) {
                for (var i = 0; i < vm.sortGridBy.length; i++) {
                    if (column.binding == vm.sortGridBy[i].binding) {
                        vm.sortGridBy[i].sortDesc = column.sortDesc;
                        break;
                    }
                }
            }
            vm.paginationChanged();
        }

        // Shows error information for the line the user chose
        vm.showErrorInformation = function showErrorInformation(line) {
            if (line.policyUploadErrorTypeId && line.policyUploadErrorTypeId > 0) {
                vm.errorInformation.errorType = line.policyUploadErrorType;
                vm.errorInformation.errorMessage = line.errorMessage;
                vm.errorInformation.csvRowNumber = line.csvRowNumber;
                vm.errorInformation.resId = line.resID;
                vm.showErrorInfo = true;
            } else if (line.policyNumber == null) {
                vm.errorInformation.errorType = 'Internal Error';
                vm.errorInformation.errorMessage = 'There was an issue while processing this policy. Please reach out to your sales representative with this information so that it can be resolved.';
                vm.errorInformation.csvRowNumber = line.csvRowNumber;
                vm.errorInformation.resId = line.resID;
                vm.showErrorInfo = true;
            }
           else {
                vm.showErrorInfo = false;
            }
        }
        
        // Toggles the grid to show errorsOnly or not
        vm.toggleErrors = function toggleErrors() {
            vm.errorsOnly = !vm.errorsOnly;
            vm.paginationChanged();
        }

        // Removes the error information that was displayed from the user clicking on an error row.
        vm.hideErrorInfo = function hideErrorInfo() {
            vm.showErrorInfo = false;
        }

        // This needs to be finished in another story, setting up a mock method for now.
        vm.downloadPolicies = function downloadPolicies() {
            var uploadId = $stateParams.uploadId;
            var upload = null;
            var deferredPromise = $q.defer();
            nonMerchantPolicies.getPolicyDetails(uploadId, false).then(function (result) {
                upload = result;
                if (upload) {
                    generateFile(result, vm.errorsOnly);
                }
                deferredPromise.resolve(result);
            });
            return deferredPromise.promise;

        }

        function generateFile(upload, errorsOnly) {
            var fileName = upload.fileName;
            if (errorsOnly === true) {
                fileName = 'errors-' + fileName;
            }

            var results = nonMerchantPolicies.getExportUploadedPolicy(upload.id, errorsOnly).then(function (result) {
                var link = document.createElement("a");

                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", fileName);
                }

                if (navigator.msSaveBlob) { // IE 10+
                    link.addEventListener("click", function (event) {
                        var blob = new Blob([result], {
                            "type": "text/csv;charset=utf-8;"
                        });
                        navigator.msSaveBlob(blob, fileName);
                    }, false);
                }

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
        
        // Sets the boolean for whether all columns should be displayed and changes button text
        vm.columnDisplay = function columnDisplay() {
            vm.allColumns = !vm.allColumns;

            if (vm.allColumns) {
                vm.columnDisplayText = 'Hide columns';
            } else {
                vm.columnDisplayText = 'Show all columns';
            }
        }

        // Hides or shows the column header based on the alwaysShow property or if all columns are being displayed.
        vm.showColumnHeader = function showColumnHeader(column) {
            var shouldShow = false;

            // If column is always show return true
            if (column.alwaysShow) {
                shouldShow = true;
            }

            // If all columns should be displayed return true
            if (vm.allColumns) {
                shouldShow = true;
            }

            return shouldShow;
        }

        // Hides or shows the column data based on the alwaysShow property of it's header or if all columns are being displayed.
        vm.showColumnData = function showColumnData(propName) {
            var shouldShow = false;

            // If all columns should be shown return true
            if (vm.allColumns) {
                shouldShow = true;
            } else {
                // Loop through column headers to compare property name to binding of column headers
                for (var i = 0; i < vm.columns.length; i++) {
                    if (propName == vm.columns[i].binding && vm.columns[i].alwaysShow) {
                        shouldShow = true;
                    }
                }
            }

            return shouldShow;
        }

        init();
    }
})();