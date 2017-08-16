(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name policyManagementController
     *
     *
     *
     * @description
     * controller for agents to view policies that have been uploaded.
     */
    angular.module('agentPortal')
            .controller('policyManagementController', ['nonMerchantPolicies', '$q', '$state', 'format', '$window', '$rootScope', 'settings', policyManagementController]);
    function policyManagementController(nonMerchantPolicies, $q, $state, format, $window, $rootScope, settings) {
        var vm = this;
        vm.searchText = null;
        vm.filteredStatus = '';
        vm.refreshDataFlag = false;

        function formatUploadTime(uploadList) {
            for (var i = 0; i < uploadList.length; i++) {
                uploadList[i].uploadLocalDateTime = format.getLocalDateFromUTC(uploadList[i].uploadDateTimeUTC, 'M/D/YYYY LT');
            }
            return uploadList;
        }

        vm.loadPolicies = function loadPolicies() {
            var deferredPromise = $q.defer();
            nonMerchantPolicies.getPoliciesUploaded().then(function (results) {
                results = formatUploadTime(results);
                deferredPromise.resolve(results);
            });
            return deferredPromise.promise;
        }

        /* Sends user to the uploading portion.*/
        vm.uploadPolicies = function uploadPolicies() {
            $state.go('adminPolicyManagementUpload');
        }

        /**
        * @description
        * grid action for exporting csv
        */
        vm.exportUpload = function getCustomFilters(upload) {
            var fileName = upload.fileName;

            var results = nonMerchantPolicies.getExportUploadedPolicy(upload.id, false).then(function (result) {
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

        /**
         * @description
         * grid configuration for policies grid
         */
        vm.gridConfig = {
            noDataMessage: "No policies found",
            allowMultiSelect: false,
            hasActions: true,
            columns: [
                { header: "Upload Date", binding: "uploadLocalDateTime", href: 'admin/policyManagement/policyDetail/{{row.id}}' },
                { header: "File Name", binding: "actualFileName" },
                { header: "Agency Code", binding: "agencyCode" },
                { header: "Total Policies", binding: "totalUniqueRows", filter: "number", isCurrency: false },
                { header: "# Successful", binding: "totalSuccessfulRows", filter: "number", isCurrency: false },
                { header: "# Invalid", binding: "totalErrorCount", filter: "number", isCurrency: false }
            ],
            actionList: [
                { label: "View", icon: "glyphicon-eye-open", href: 'admin/policyManagement/policyDetail/{{row.id}}' },
                { label: "Export", icon: "glyphicon-download", click: vm.exportUpload, href: '#' }
            ],
            defaultOrderBy: "uploadDateTimeUTC",
            defaultOrder: true,
            rowIdentifier: "id",
        }

        vm.getCustomFilters = function getCustomFilters() {
            return [
                { key: "status", value: vm.filteredStatus }
            ];
        }

        vm.refreshData = function refreshData() {
            vm.refreshDataFlag = true;
        }

    }
})();