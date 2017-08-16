(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name batchUploadController
     *
     * @description
     * controller for agents to bulk upload policy information.
     */
    angular.module('agentPortal')
            .controller('batchUploadController', ['$scope', '$q', '$stateParams', '$modal', 'format', '$window', 'settings', 'portalService', 'batchUploadService', 'tableHelper', 'utilService', '$location', batchUploadController]);

    function batchUploadController($scope, $q, $stateParams, $modal, format, $window, settings, portalService, batchUploadService, tableHelper, utilService, $location) {
        var vm = this;
        var STATUS_All = "All";
        var statuses = {
            submitted: {
                processing: "Submitted - Processing",
                processed: "Submitted - Processed",
                complete: "Submitted - Complete",
                errors: "Submitted - Errors",
            },
            draft: "Draft",
            newStatus:"New",
        };

        var templates = {};
        var batchStatusPollingTimers = {};

        vm.configuration = {};

        vm.reloadDataFlag = false;
        vm.refreshDataFlag = false;

        vm.statusFilter;
        vm.statusPool = getUpdatedStatusPool();

        vm.batchTableControl = {};
        vm.batch = null;
        vm.lastSavedHashes = {};
        vm.lastSavedBatchName = null;
        vm.duplicateError = null;

        vm.errorCodes = {
            duplicateName: '4104',
            duplicateRow: '4109',
            batchLockedByOtherUser: '4110',
        };

        vm.gridConfig = {
            noDataMessage: "No batches found",
            allowMultiSelect: false,
            hasActions: true,
            columns: [
                { header: "", useIcon: true, binding: "icon", preferredWidth: '1%' },
                { header: "Batch Name", binding: "batchName", preferredWidth: '10%', showAsLink: true, click: batchSummaryColumnClicked },
                { header: "Batch ID", binding: "batchId", preferredWidth: '5%' },
                { header: "Status", binding: "status", preferredWidth: '10%' },
                { header: "Last Edited", binding: "modifiedDate", filter: "date", filterParam: settings.date.format, preferredWidth: '5%' },
                { header: "Errors", binding: "errorCount", preferredWidth: '2%' }
            ],
            defaultOrderBy: "status",
            defaultOrder: true,
            rowIdentifier: "batchId"
        }

        vm.batchTableReady = function () { };

        $scope.$on("$destroy", function handler() {
            $($window).off('bhtp.willNavigate');
            activityTracker.stop();
            batchStatusTracker.stop();
        });

        $($window).on('bhtp.willNavigate', function (event, continueNav) {
            event.preventDefault();

            if (vm.batch) {
                attemptCloseBatch(function () {
                    continueNav();
                });
            } else {
                continueNav();
            }
        });

        // when a new row is added to the grid, give it a unique
        // ID and associate it with the batch
        vm.newRowCallback = function (newRow) {
            newRow.correlationId = getNewCorrelationId();
            newRow.batchId = vm.batch.batchId;

            return newRow;

            // time in milliseconds as a unique id
            function getNewCorrelationId() {
                var date = new Date();
                var id = date.getTime();

                return id;
            }
        };

        // when user clicks out of row, rate row if possible
        vm.rowBlurred = function (row, rowIndex) {
            var targetRow = vm.batch.rows[rowIndex];
            var previousHash = targetRow.policyBearingHash || "0";
            var updatedHash = buildPolicyBearingHash(row);

            // check if any premium bearing fields changed
            if (updatedHash !== previousHash && hasRequiredFieldsPopulated(row) && !tableHelper.hasFieldErrors(row)) {
                targetRow.policyBearingHash = updatedHash;
                
                clearPaymentInfoColumns();

                // get a quote
                batchUploadService.rateBatchRow(targetRow)
                    .then(function (response) {
                        handleResponse(response, targetRow);
                    }, function (response, status) {
                        handleResponse(response, targetRow);
                    });
            }

            function handleResponse(response, targetRow) {
                // set rating information in read only columns
                assignPaymentInfoColumns(response);

                if (targetRow.data && response.response && response.response.errors) {
                    targetRow.data.errors = response.response.errors;
                }

                targetRow.apiErrors = [];
                if (response && response.messages) {
                    response.messages.forEach(function (message, messages) {
                        // ignore "you're a great developer" message
                        // Remove duplciate messages so we don't blow up ng-repeat
                        if (message.severity !== 4 && !targetRow.apiErrors.find(function (existingMessage) {
                            return existingMessage === message.text;
                        })) {
                            targetRow.apiErrors.push(message.text);
                        }
                    });
                }

                processBatchRowErrors(targetRow, false);
            }

            function assignPaymentInfoColumns(response) {
                var currentRow = vm.batch.rows[rowIndex].data;

                // show a breakdown of premium
                if (response && response.response) {
                    currentRow.basePremium = response.response.basePremium;
                    currentRow.fees = response.response.fees;
                    currentRow.optionalCoverages = response.response.optionalCoverages;
                    currentRow.ratedTotalCost = response.response.ratedTotalCost;
                }
                else {
                    clearPaymentInfoColumns();
                }
            }

            function clearPaymentInfoColumns() {
                var currentRow = vm.batch.rows[rowIndex].data;

                var loadingText = "Loading...";

                currentRow.basePremium = loadingText;
                currentRow.fees = loadingText;
                currentRow.optionalCoverages = loadingText;
                currentRow.ratedTotalCost = loadingText;
            }
        };

        // when user leaves cell, check that required and max length conditions
        // are satisfied
        vm.cellBlurred = function (rowIndex, cellHeader) {
            $window.setTimeout(function () {
                validateCell(rowIndex, cellHeader);
            }, 200);
        };

        // delete a batch from the batch summary table
        vm.removeBatch = function (batch) {
            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/destructiveConfirmModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.title = "Confirm Delete";
                    $scope.message = "Are you sure you want to delete this batch?";

                    $scope.ok = function () {
                        // mark batch as deleted and save
                        $scope.deleting = true;
                        batch.deleted = true;
                        batchUploadService.saveBatch(batch).then(function (result) {
                            // on successful deletion, refresh batch summary table
                            vm.refreshData();
                            vm.reloadData();
                            $scope.deleting = false;
                            $modalInstance.dismiss('close');
                        }, function (errorResult) {
                            utilService.showPopup("Error", "An error occurred while deleting the batch");
                            $scope.deleting = false;
                            $modalInstance.dismiss('close');
                        });
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }]
            });
        };

        // refresh function for batch summary table
        vm.loadData = function () {
            var deferredPromise = $q.defer();

            var promises = [];

            if (!vm.agent) {
                // get the agent to determine if they have the batch locked
                promises.push(portalService.getAgentByInternalId().then(function (agent) {
                    vm.agent = agent;
                }));
            }
            
            if (!vm.batches || vm.refreshDataFlag) {
                // get all the batches for this agency
                promises.push(batchUploadService.getAllBatches().then(function (batches) {
                    vm.batches = batches;
                }));
            }
            

            $q.all(promises).then(function () {
                vm.statusPool = getUpdatedStatusPool(vm.batches);

                // copy the data so sorts don't affect sort order
                var batches = JSON.parse(JSON.stringify(vm.batches));

                // filter batches by status
                if (vm.statusFilter !== STATUS_All) {
                    for (var i = batches.length - 1; i >= 0; i--) {
                        if (batches[i].status !== vm.statusFilter) {
                            batches.splice(i, 1);
                        }
                    }
                }

                // calculate which icon to display based on status
                for (var i = 0; i < batches.length; i++) {
                    var status = batches[i].status;
                    var icon = '';
                    var processing = false;

                    if (status === statuses.submitted.processing) {
                        startStatusPolling(batches[i].batchId);
                        processing = true;
                    }

                    if (status === statuses.submitted.complete) {
                        icon = 'check-circle'
                    }
                    else if (processing || (status.length >= statuses.submitted.processing.length && status.substring(0, statuses.submitted.processing.length) === statuses.submitted.processing)) {
                        icon = 'spinner fa-spin fa-pulse';
                    }
                    else if (batchIsLockedForAgent(batches[i], vm.agent.agentCode)) {
                        icon = 'lock';
                    }
                    else if (status === statuses.submitted.errors) {
                        icon = 'times-circle'
                    }
                    else {
                        icon = 'edit';
                        batches[i].actions = [];
                        batches[i].actions.push({ label: "Remove", click: vm.removeBatch, icon: "glyphicon-trash", href: "#" });
                    }

                    // if the agent is the DRP and another user has the batch locked, give the
                    // DRP the option to unlock the batch
                    if (portalService.getCurrentAgentIsDRP() && batchIsLocked(batches[i])) {
                        if (!batches[i].actions) {
                            batches[i].actions = [];
                        }
                        batches[i].actions.push({ label: "Unlock", click: promptUnlockBatch, icon: "glyphicon-trash", href: "#" });
                    }

                    batches[i].icon = icon;
                }

                vm.gridConfig.totalRecords = batches.length;

                deferredPromise.resolve(batches);
            });

            return deferredPromise.promise;

            function promptUnlockBatch(batch) {
                var modalInstance = $modal.open({
                    templateUrl: 'app/admin/batchupload/destructiveConfirmModal.html',
                    resolve: {},
                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                        $scope.title = "Confirm Unlock";
                        $scope.message = "If there are unsaved changes in " + batch.batchName + ", unlocking could result in the the loss of those changes. Are you sure you would like to proceed?";

                        $scope.ok = function () {
                            unlockBatch(batch);
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }]
                });
            }

            function unlockBatch(batch) {
                batchUploadService.unlockBatch(batch.batchId).then(
                    function () {
                        displayBasicMessageModal("Batch Unlocked", "The batch has been unlocked and can now be edited by another Agent.");
                    },
                    function () {
                        displayBasicMessageModal("Unlock Failed", "The batch could not be unlocked at this time.");
                    });
            }
        };

        /**
         * @description
         * reloads batch summaries from the server
         */
        vm.reloadData = function () {
            vm.reloadDataFlag = true;
        };

        /**
         * @description
         * refresh batch summaries from the server
         */
        vm.refreshData = function () {
            vm.refreshDataFlag = true;
        };

        vm.statusFilterUpdated = function () {
            vm.reloadData();
        };

        vm.saveCurrentBatch = function saveCurrentBatch() {
            var deferredPromise = $q.defer();

            clearApiErrors();

            batchUploadService.saveBatch(vm.batch)
                .then(function (result) {
                    updateBatchWithResult(result);

                    if (!result) {
                        deferredPromise.reject();
                    }
                    else {
                        deferredPromise.resolve(result);
                    }
                }, function (errorResult) {
                    handleSaveErrorResult(errorResult);

                    deferredPromise.reject(errorResult);
                });

            return deferredPromise.promise;
        };

        vm.onBatchFormSubmit = function onBatchFormSubmit() {
            if ($scope.vm.batchForm.$valid) {
                vm.saveCurrentBatch().then(function(result) {
                    vm.refreshData();
                    vm.reloadData();
                });
            }
        };

        vm.onCreateBatchClick = function onCreateBatchClick() {
            executeAfterUnsavedChangesCheck(function () {
                assignBatch(getNewBatch());
            }, false);
        };

        vm.onBatchNameChange = function onBatchNameChange() {
            clearApiErrors();
        };

        vm.onBatchCloseClick = function onBatchCloseClick() {
            if (!batchHasChanges(false) || $scope.vm.batchForm.$valid) {
                attemptCloseBatch();
            } else {
                $scope.vm.batchForm.$submitted = true;
            }
        };

        vm.onBatchSubmitClick = function onBatchSubmitClick() {
            if ($scope.vm.batchForm.$valid) {
                submitBatch().then(function () {
                    // when batch is submitted, poll the status so user
                    // can see how each row is doing
                    startStatusPolling(vm.batch.batchId);
                    vm.refreshData();
                    vm.reloadData();
                });
            } else {
                $scope.vm.batchForm.$submitted = true;
            }
        };

        // download template for batch import
        vm.onDownloadTemplateClick = function onDownloadTemplateClick() {

            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/downloadTemplateConfirmModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.title = "Confirm Download";
                    $scope.message = "Are you sure you want to download this batch template?";

                    $scope.ok = function () {
                            var deferredPromise = $q.defer();
                            clearApiErrors();
                            downloadTemplate(deferredPromise);
                            $modalInstance.dismiss('close');
                            return deferredPromise.promise;
                    }, function (errorResult) {
                            utilService.showPopup("Error", "An error occurred while downloading the batch template");
                            $modalInstance.dismiss('close');
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }]
            });
        }

        // extracted 'ok' modal logic to a separate function for downloading template
        function downloadTemplate(deferredPromise) {
            var fileName = "Batch_Import_Template.csv";

            batchUploadService.downloadTemplate("BHTP")
                .then(function (result) {
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
                }, function () {
                    deferredPromise.reject();
                });

            return deferredPromise;
        }

        // display file selector for importing rows from a file
        vm.onFileUploadClick = function onFileUploadClick() {

            executeAfterUnsavedChangesCheck(function () {
                var modalInstance = $modal.open({
                    templateUrl: 'app/admin/batchupload/fileUploadModal.html',
                    resolve: {},
                    controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                        var errorTimeout;
                        
                        $scope.dropzone; //Populated by dropzone directive

                        $scope.dropzoneConfig = {
                            maxFiles: 1,
                            acceptedFiles: ".csv,.xls,.xlsx",
                            maxFileSize: 30,
                            autoProcessQueue: false,
                            url: "placeholder",
                            dictInvalidFileType: "You must choose a .CSV, .XLS, or .XLSX file type"
                        };

                        $scope.hasFile = function () {
                            var hasFile = false;

                            if ($scope.dropzone && $scope.dropzone.files.length) {
                                hasFile = true;
                            }

                            return hasFile;
                        };

                        $scope.upload = function () {
                            if ($scope.dropzone && $scope.dropzone.files.length) {
                                var pendingFile = $scope.dropzone.files[0];

                                batchUploadService.processFile(pendingFile, vm.batch.batchId)
                                    .then(function (response) {
                                        // Clear out the uploaded file
                                        $scope.dropzone.removeFile(pendingFile);
                                        // Extract batch and assign it to update values
                                        response.batch.batchName = vm.batch.batchName;
                                        assignBatch(response.batch);

                                        // Check for message saying that duplicates were excluded
                                        if (response.messages && response.messages.length) {
                                            for (var i = 0; i < response.messages.length; i++) {
                                                var message = response.messages[i];
                                                if (message.code === vm.errorCodes.duplicateRow) {
                                                    displayBasicMessageModal("File Imported", message.text);
                                                }
                                            }
                                        }

                                        $scope.cancel();
                                    }, function error(data) {
                                        var error = "Failed to upload file. please try again.";
                                        var  errorMessages = [];
                                        if (data) {

                                            if (data.messages && data.messages.length) {
                                                data.messages.forEach(function (message) {
                                                    if (message.severity < 4) {
                                                        errorMessages.push(message.text);
                                                    }
                                                });

                                                displayBasicMessageModal("File Upload Error", errorMessages, function () {
                                                    $scope.dzError(pendingFile, error);
                                                });
                                            }

                                            if (data.response) {
                                                data.response.batchName = vm.batch.batchName;
                                                assignBatch(data.response);
                                            }
                                        } else {
                                            $scope.dzError(pendingFile, error);
                                        }
                                    });
                            }
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.dzAddedFile = function (file) {
                            $scope.error = undefined;
                            $window.clearTimeout(errorTimeout);
                            $scope.$apply();
                        };

                        $scope.dzError = function (file, errorMessage) {
                            $scope.error = errorMessage;

                            if (file) {
                                $scope.dropzone.removeFile(file);
                                $scope.$apply();
                            }

                            errorTimeout = $window.setTimeout(function () {
                                $scope.error = undefined;
                                $scope.$apply();
                            }, 5000);
                        };
                    }],
                });
            }, true);
        };

        function executeAfterUnsavedChangesCheck(task, ignoreBatchName) {
            // if the user tries to perform an action before saving
            // the current batch, then display a 'save' prompt before
            // performing that action
            if (typeof task === "function") {
                if (batchHasChanges(ignoreBatchName)) {
                    promptSaveAndContinue(function () {
                        task();
                    });
                } else {
                    task();
                }
            }
        }

        // build a hash of fields that affect premium. This can be
        // compared to previous hashes to see if the row changed
        function buildPolicyBearingHash(row) {
            var hash = "";

            for (var property in row.data) {
                if (row.data.hasOwnProperty(property)) {
                    var cell = row.data[property];

                    if (cell.premiumBearing) {
                        hash += cell.hash + "_";
                    }
                }
            }

            return hash;
        }

        // set the current batch that displays in the batch row editor
        function assignBatch(newBatch) {
            var deferredPromise = $q.defer();
            var template = newBatch.templateId;

            updateTemplate(template)
                .then(function success() {
                    var sourceRows = newBatch.rows;
                    newBatch.rows = [];
                    vm.batch = newBatch;

                    setDefaultConfiguration();

                    vm.batchTableControl.insertRowsIntoTableRows(sourceRows, vm.batch.rows, vm.batchTableControl.getNewRow());
                    vm.lastSavedHashes = {};
                    updateLastSavedHashes(vm.batch.rows);
                    vm.lastSavedBatchName = vm.batch.batchName;

                    // Lock down everything if batch is locked
                    if (newBatch.lock && batchIsLockedForAgent(newBatch, vm.agent.agentCode)) {
                        vm.configuration.tableConfig.canAddRows = false;
                        vm.configuration.tableConfig.canDeleteRows = false;

                        vm.configuration.canUploadFile = false;
                        vm.configuration.canSave = false;
                        vm.configuration.canSubmit = false;

                        markAllRowsAsReadOnly(newBatch.rows);
                    }
                    else {
                        var allowEditOnErrorRows = true;
                        if (newBatch.status === statuses.submitted.processing || newBatch.status === statuses.submitted.complete || newBatch.status === statuses.submitted.errors) {
                            vm.configuration.canUploadFile = false;

                            if (newBatch.status === statuses.submitted.errors) {
                                vm.configuration.tableConfig.canAddRows = false;

                                vm.configuration.canUploadFile = false;
                                markCompletedRowsReadOnly(newBatch.rows);
                            } else {
                                allowEditOnErrorRows = false;
                                vm.configuration.tableConfig.canAddRows = false;
                                vm.configuration.tableConfig.canDeleteRows = false;

                                vm.configuration.canSave = false;
                                vm.configuration.canSubmit = false;

                                markAllRowsAsReadOnly(newBatch.rows);
                            }
                        }

                        processCompletedRows(newBatch.rows, allowEditOnErrorRows);

                        // if the user has an editable batch open and locked, track their activity to keep the session
                        // alive
                        if (newBatch.status === statuses.draft || newBatch.status === statuses.submitted.errors) {
                            activityTracker.start();
                        } else {
                            activityTracker.stop();
                        }
                    }

                    deferredPromise.resolve();
                }, function () {
                    deferredPromise.reject();
                });

            return deferredPromise.promise;

            function markAllRowsAsReadOnly(targetRows) {
                targetRows.forEach(function (row) {
                    row.readOnly = true;
                });
            }

            function processCompletedRows(targetRows, allowEditOnErrorRows) {
                // show policy number links and any errors associated with each row
                targetRows.forEach(function (row) {
                    processPolicyNumberOnRow(row);
                    processBatchRowErrors(row, true);
                });
            }
        }

        function markCompletedRowsReadOnly(targetRows) {
            targetRows.forEach(function (row) {
                if (row.status === statuses.submitted.complete || row.status === statuses.submitted.processed || row.status === statuses.submitted.processing) {
                    row.readOnly = true;
                } else {
                    row.readOnly = false;
                }
            });
        }

        function processPolicyNumberOnRow(row) {
            // build a link to the policy details page with the policy number
            if (row.data.hasOwnProperty("policyNumber") && row.data.hasOwnProperty("status")) {
                var status = row.data["status"];
                var policyNumber = row.data["policyNumber"];
                if (policyNumber && status === statuses.submitted.complete) {
                    policyNumber = {
                        display: policyNumber,
                        href: '/policies/view/' + policyNumber
                    };
                }
                else {
                    policyNumber = null;
                }

                row.data["policyNumber"] = policyNumber;
            }
        }

        function processBatchRowErrors(row, clearErrors) {
            if (clearErrors) {
                row.apiErrors = [];
            }

            // add batch row errors to row for display
            if (row.data && row.data.errors) {
                row.data.errors.forEach(function (error) {
                    row.apiErrors.push(error.message);
                });
            }
        }

        function attemptCloseBatch(batchWasClosedHandler) {
            if (batchHasChanges(false)) {
                promptCloseBatch(batchWasClosedHandler);
            } else {
                if (typeof batchWasClosedHandler === "function") {
                    batchWasClosedHandler();
                }
                closeBatch();
            }
        }

        function promptSaveAndContinue(continueFunction) {
            if (typeof continueFunction !== "function") {
                return;
            }

            // display a modal to the user to save changes if they switch batches before
            // saving the current batch
            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/closeBatchModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.continueText = "Save and Continue";

                    $scope.saveAndClose = function () {
                        if (vm.batch.batchName && vm.batch.batchName !== '') {
                            vm.saveCurrentBatch()
                            .then(function () {
                                vm.refreshData();
                                vm.reloadData();
                                continueFunction();
                                $modalInstance.dismiss('close');
                            }, function (errorResult) {
                                $modalInstance.dismiss('close');
                                saveErrorsOnClose();
                            });
                        }
                        else {
                            vm.batchForm.$setSubmitted();
                            $modalInstance.dismiss('close');
                        }
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    $scope.discard = function () {
                        continueFunction()
                        $modalInstance.dismiss('close');
                    };
                }]
            });
        }

        function promptCloseBatch(batchWasClosedHandler) {
            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/closeBatchModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.saveAndClose = function () {
                        vm.saveCurrentBatch()
                            .then(function () {
                                closeBatch();
                                callBatchWasClosedHandler();
                                $modalInstance.dismiss('close');
                            }, function (errorResult) {
                                $modalInstance.dismiss('close');
                                saveErrorsOnClose();
                            });
                    };

                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    $scope.discard = function () {
                        closeBatch();
                        callBatchWasClosedHandler();
                        $modalInstance.dismiss('close');
                    };
                }]
            });

            function callBatchWasClosedHandler() {
                if (typeof batchWasClosedHandler === "function") {
                    batchWasClosedHandler();
                }
            }
        }

        function saveErrorsOnClose() {
            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/saveBatchErrorsCloseModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.ok = function () {
                        $modalInstance.dismiss('close');
                    };
                }]
            });
        }

        function closeBatch() {
            activityTracker.stop();

            if (vm.batch && vm.batch.batchId && vm.batch.batchId > 0) {
                batchUploadService.unlockBatch(vm.batch.batchId);
            }

            vm.batch = null;
        }

        function submitBatch() {
            var deferredPromise = $q.defer();

            clearApiErrors();

            batchUploadService.submitBatch(vm.batch)
                .then(function (result) {
                    updateBatchWithResult(result);

                    if (!result) {
                        deferredPromise.reject();
                    }
                    else {
                        deferredPromise.resolve(result);
                    }
                }, function (errorResult) {
                    handleSaveErrorResult(errorResult);

                    deferredPromise.reject(errorResult);
                });

            return deferredPromise.promise;
        }

        function batchHasChanges(ignoreBatchName) {
            var batchHasChanges = false;

            if (vm.batch) {
                for (var i = 0; i < vm.batch.rows.length; i++) {
                    var row = vm.batch.rows[i];
                    var previousHash = vm.lastSavedHashes[row.uniqueId];
                    var currentRowHash = tableHelper.getRowHash(row);

                    if ((!previousHash && tableHelper.rowIsPopulated(row)) || (previousHash && currentRowHash !== previousHash)) {
                        batchHasChanges = true;
                        break;
                    }
                }

                if ((!batchHasChanges && getLastSavedHashesCount() > vm.batch.rows.length) || (!ignoreBatchName && vm.lastSavedBatchName !== vm.batch.batchName)) {
                    batchHasChanges = true;
                }
            }

            return batchHasChanges;
        }

        function getLastSavedHashesCount() {
            var hashCount = 0;

            for (var property in vm.lastSavedHashes) {
                if (vm.lastSavedHashes.hasOwnProperty(property)) {
                    hashCount++;
                }
            }

            return hashCount;
        }

        function batchIsLocked(batch) {
            var batchIsLocked = false;

            if (batch && batch.lock) {
                batchIsLocked = batch.lock.isLocked;
            }

            return batchIsLocked;
        }

        function batchIsLockedForAgent(batch, agentCode) {
            var batchIsLocked = false;

            if (batch && batch.lock) {
                batchIsLocked = batch.lock.isLocked && batch.lock.createdAgentId !== agentCode;
            }

            return batchIsLocked;
        }

        function updateBatchWithResult(sourceBatch) {
            var newBatch = JSON.parse(JSON.stringify(sourceBatch));
            assignBatch(newBatch);
        }

        function updateLastSavedHashes(rows) {
            rows.forEach(function (row, index) {
                if (row.status !== statuses.newStatus) {
                    vm.lastSavedHashes[row.uniqueId] = tableHelper.getRowHash(row);
                }
            });
        }

        function handleSaveErrorResult(errorResult) {
            if (errorResult && errorResult.messages && errorResult.messages.length > 0) {
                vm.duplicateError = utilService.getMessageWithCode(vm.errorCodes.duplicateName, errorResult.messages);
            }
        }

        // clear errors related to saving the batch name
        function clearApiErrors() {
            vm.duplicateError = null;
        }

        function hasRequiredFieldsPopulated(row) {
            for (var property in row.data) {
                if (row.data.hasOwnProperty(property)) {
                    if (!row.data[property].value || row.data[property].value === "") {
                        if (row.data[property].isRequired && row.data[property].group.isRequired) {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        function validateCell(rowIndex, cellHeader) {
            if (vm.batch.rows.length > rowIndex) {
                var targetRow = vm.batch.rows[rowIndex];
                if (!targetRow.fieldErrors) {
                    targetRow.fieldErrors = {};
                }

                var canSave = true;
                var canSubmit = true;

                var value = targetRow.data[cellHeader.bhtpModel];

                // check required and max length conditions
                if (cellHeader.isRequired && (!value || value === "")) {
                    checkRequiredColumn(cellHeader, targetRow);
                }
                else if (value && value.length > cellHeader.maxLength) {
                    targetRow.fieldErrors[cellHeader.bhtpModel] = cellHeader.group.label + ' ' + cellHeader.label + ' must have ' + cellHeader.maxLength + ' or fewer characters';
                    canSave = false;
                    canSubmit = false;
                }
                else {
                    // errors are keyed by property name, so clear any old errors if there is no longer an error
                    delete targetRow.fieldErrors[cellHeader.bhtpModel];
                }

                // prevent saving and submitting if the value is too long because
                // it won't save to the database
                vm.configuration.canSave = canSave;
                vm.configuration.canSubmit = canSubmit;
            }
        }

        function checkRequiredColumn(cellHeader, targetRow) {
            var requiresValue = true;
            var removeGroupErrors = false;

            // if the column is required, but the group isn't then check other
            // columns for a value (ex: traveler #2 isn't required, but if there
            // is data filled in on it then display an error
            if (!cellHeader.group.isRequired) {
                var hasValues = false;
                cellHeader.group.columns.forEach(function (column) {
                    var groupColumnValue = targetRow.data[column.bhtpModel];
                    hasValues = hasValues || Boolean(groupColumnValue && groupColumnValue !== "");
                });

                requiresValue = hasValues;
                removeGroupErrors = !hasValues;
            }

            if (requiresValue) {
                targetRow.fieldErrors[cellHeader.bhtpModel] = cellHeader.group.label + ' ' + cellHeader.label + ' is required';
            }
            else if (removeGroupErrors) {
                // if the value is cleared and none of the columns in the group
                // have values, then remove any errors for those columns
                cellHeader.group.columns.forEach(function (column) {
                    delete targetRow.fieldErrors[column.bhtpModel];
                });
            }
        }

        function getUpdatedStatusPool(batchList) {
            var newStatusPool = [STATUS_All];
            if (batchList) {
                batchList.forEach(function (item, index) {
                    if (!statusIsInList(item.status, newStatusPool)) {
                        newStatusPool.push(item.status);
                    }
                });
            }

            return newStatusPool;

            function statusIsInList(status, list) {
                var isInList = false;

                for (var i = 0; i < list.length; i++) {
                    var suspectStatus = list[i];

                    if (status === suspectStatus) {
                        isInList = true;
                        break;
                    }
                }

                return isInList;
            }
        }

        function getNewBatch() {
            var newBatch = {
                batchName: "",
                batchId: null,
                templateId: "bhtp",
                status: statuses.newStatus,
                rows: []
            };

            $scope.vm.batchForm.$submitted = false;
            $scope.vm.batchForm.batchName.$touched = false;

            return newBatch;
        }

        // periodically hit the API to see the status of the batch and rows
        function startStatusPolling(batchId) {
            if (!batchStatusPollingTimers[batchId]) {
                executeStatusPolling(batchId);
            }

            function executeStatusPolling(batchId) {
                batchUploadService.getBatchStatus(batchId).then(function success(response) {
                    var rowsProcessing = updateBatchStatus(response);
                    vm.reloadData();

                    // Only keep going while the batch status is processing or rows are still getting
                    // sent to salesforce
                    if (response.status === statuses.submitted.processing || rowsProcessing) {
                        batchStatusPollingTimers[batchId] = setTimeout(function () {
                            executeStatusPolling(batchId);
                        }, 2000);
                    } else {
                        // Clear out pollling so it can be started again if resubmitted
                        cancelStatusPolling(batchId);
                    }
                }, function error(response) {
                    cancelStatusPolling(batchId);
                });
            }
        }

        function cancelStatusPolling(batchId) {
            var timeoutId = batchStatusPollingTimers[batchId];
            if (timeoutId) {
                clearTimeout(timeoutId);
                delete batchStatusPollingTimers[batchId];
            }
        }

        function updateBatchStatus(updatedBatchStatus) {
            var rowsProcessing = false;
            if (vm.batches && vm.batches.length) {
                for (var i = 0; i < vm.batches.length; i++) {
                    var targetBatch = vm.batches[i];

                    if (targetBatch.batchId === updatedBatchStatus.batchId) {

                        var ignoreList = ['batchId', 'rows'];

                        // Update properties on the batch
                        for (var property in targetBatch) {
                            if (targetBatch.hasOwnProperty(property) && updatedBatchStatus.hasOwnProperty(property)) {
                                if (!tableHelper.stringInList(property, ignoreList)) {
                                    targetBatch[property] = updatedBatchStatus[property];
                                }
                            }
                        }

                        // Get count of how many rows are finished if actively processing
                        if (targetBatch.status === statuses.submitted.processing) {
                            var amountProcessed = 0;
                            var total = updatedBatchStatus.rows.length;
                            updatedBatchStatus.rows.forEach(function (statusRow, index) {
                                // Increment count based on status
                                if (statusRow.status === statuses.submitted.processed || statusRow.status === statuses.submitted.complete || statusRow.status === statuses.submitted.errors) {
                                    amountProcessed++;
                                }
                            });

                            targetBatch.status += " (" + amountProcessed + "/" + total + ")";
                        }

                        if (vm.batch && vm.batch.batchId === updatedBatchStatus.batchId) {
                            vm.batch.status = targetBatch.status;
                        }

                        // check to see if rows are still being processed to SFDC
                        updatedBatchStatus.rows.forEach(function (statusRow, index) {
                            // Update with policy number and status if the batch is open
                            if (vm.batch && vm.batch.batchId === updatedBatchStatus.batchId) {
                                var targetRow = vm.batch.rows[index];
                                targetRow.status = statusRow.status;
                                targetRow.data.status = statusRow.status;
                                targetRow.data.policyNumber = statusRow.policyNumber;
                                targetRow.data.errors = statusRow.errors;
                                targetRow.data.basePremium = statusRow.basePremium;
                                targetRow.data.fees = statusRow.fees;
                                targetRow.data.optionalCoverages = statusRow.optionalCoverages;
                                targetRow.data.ratedTotalCost = statusRow.ratedTotalCost;
                                processPolicyNumberOnRow(targetRow);
                                processBatchRowErrors(targetRow, true);
                                markCompletedRowsReadOnly(vm.batch.rows);
                            }

                            if (statusRow.status !== statuses.submitted.complete && statusRow.status !== statuses.submitted.errors) {
                                rowsProcessing = true;
                            }
                        });

                        break;
                    }
                }
            }

            return rowsProcessing;
        }

        // open a batch in the editor when the name column is clicked in the summary table
        function batchSummaryColumnClicked(row) {
            executeAfterUnsavedChangesCheck(function () {
                clearApiErrors();
                batchUploadService.getBatchById(row.batchId)
                    .then(function (result) {
                        if (!batchIsLockedForAgent(result, vm.agent.agentCode)) {
                            updateBatchWithResult(result);
                        } else {
                            displayBasicMessageModal("Batch In Use", "This batch has been opened by another user and can not be edited at the moment", function () {
                                updateBatchWithResult(result);
                            });
                        }
                    }, function (errorResult) {
                        handleSaveErrorResult(errorResult);
                    });
            }, false);
        }

        function getAndOpenBatchById(batchId) {
            batchUploadService.getBatchById(batchId)
                .then(function (result) {
                    updateBatchWithResult(result);
                }, function (errorResult) {
                    handleSaveErrorResult(errorResult);
                });
        }

        function updateTemplate(templateId) {
            var deferredPromise = $q.defer();

            // check if template is already stored locally
            if (templates[templateId]) {
                assignTemplate(templates[templateId]);
            } else {
                // if not local, get template from server and store locally
                batchUploadService.getContentTemplate(templateId).then(function (result) {
                    templates[templateId] = result.response
                    assignTemplate(templates[templateId]);
                }, function () {
                    console.log("issue retrieving template");
                    deferredPromise.reject();
                });
            }

            return deferredPromise.promise;

            function assignTemplate(template) {
                vm.contentTemplate = template;
                if (vm.batchTableControl.updateTemplate) {
                    vm.batchTableControl.updateTemplate(vm.contentTemplate);
                }
                deferredPromise.resolve(template);
            }
        }

        function init() {
            setDefaultConfiguration();
            batchStatusTracker.start();
        }

        // set save, cancel, submit, upload file availability to default state
        function setDefaultConfiguration() {
            if (!vm.configuration.tableConfig) {
                vm.configuration.tableConfig = {
                    canAddRows: true,
                    canDeleteRows: true,
                };
            }
            else {
                vm.configuration.tableConfig.canAddRows = true;
                vm.configuration.tableConfig.canDeleteRows = true;
            }
            
            vm.configuration.canClose = true;
            vm.configuration.canSave = true;
            vm.configuration.canSubmit = true;
            vm.configuration.canUploadFile = true;
        }

        // track user activity on the page and periodically call API
        // to extend lock on current batch
        var activityTracker = (function () {
            var msInSecond = 1000;
            var secondsInMinute = 60;
            var inactivityTimeoutLength = 10 * secondsInMinute * msInSecond;
            var activityReportingDebounceLength = 30 * msInSecond;

            var inactivityTimeout;
            var activityDebounceTimeout;
            var inactivityModal;

            var expireTime;

            function updateTimeout (timeoutId, action, timeoutDelay) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                return setTimeout(action, timeoutDelay);
            }

            function reportActivity () {
                batchUploadService.reportUserActivity(vm.batch.batchId).then(
                    function success(lockResponse) {
                        var updatedExpireTime = moment(lockResponse.lockExpireDate).utc();
                        if (updatedExpireTime.isValid()) {
                            expireTime = updatedExpireTime;
                        }
                    },
                    function error(response) {
                        
                        if (response.messages) {
                            response.messages.forEach(function (message) {
                                if (message.code === vm.errorCodes.batchLockedByOtherUser) {
                                    displayBasicMessageModal("Batch Error", "This batch has been opened by another user and can no longer be edited", function () {
                                        stop();
                                        getAndOpenBatchById(vm.batch.batchId);
                                    });
                                }
                            });
                        } else {
                            console.log("failed to extend lock");
                        }
                    });
            }

            function resetInactivityTimeout () {
                inactivityTimeout = updateTimeout(inactivityTimeout, function () {
                    if (!inactivityModal && expireTime) {
                        pause();
                        inactivityModal = $modal.open({
                            templateUrl: 'app/admin/batchupload/messageModal.html',
                            resolve: {},
                            backdrop: "static",
                            keyboard: false,
                            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                var batchName = vm.batch.batchName;
                                $scope.messages = [updateMessage()];
                                $scope.title = batchName + " is about to close";

                                setInterval(function () {
                                    $scope.messages[0] = updateMessage();
                                    $scope.$apply();
                                }, 1000);

                                $scope.ok = function () {
                                    inactivityModal = undefined;
                                    $modalInstance.dismiss('cancel');
                                    start();
                                };

                                function updateMessage() {
                                    var current = moment().utc();

                                    if (current >= expireTime) {
                                        return batchName + " was left open for too long and was made available for other agents to modify. If another agent has opened this batch, you will not be able to continue making changes";
                                    } else {
                                        return batchName + " will close in " + getMinutes(current, expireTime) + ":" + getSeconds(current, expireTime) + " so that it can be accessed by other agents. Hit okay to continue working and keep the batch open.";
                                    }

                                    function getMinutes(now, then) {
                                        return padZero(getDiff(now, then, "minutes"));
                                    }

                                    function getSeconds(now, then) {
                                        return padZero(getDiff(now, then, "seconds") % secondsInMinute);
                                    }

                                    function getDiff(now, then, unit) {
                                        return Math.abs(now.diff(then, unit));
                                    }

                                    function padZero(value) {
                                        value += ""; //hacky convert to string

                                        if (value.length <= 1) {
                                            value = "0" + value;
                                        }

                                        return value;
                                    }
                                }
                            }]
                        });
                    }
                    
                    inactivityTimeout = undefined;
                }, inactivityTimeoutLength);
            }

            function start() {
                stop();
                reportActivity();
                resetInactivityTimeout();

                $($window).on("click touch scroll", function () {
                    if (!inactivityModal) {
                        resetInactivityTimeout();

                        if (!activityDebounceTimeout) {
                            activityDebounceTimeout = setTimeout(function () {
                                activityDebounceTimeout = undefined;
                                reportActivity();
                            }, activityReportingDebounceLength);
                        }
                    }
                });
            }

            function pause() {
                $($window).off("click touch scroll");
                clearTimeout(activityDebounceTimeout);
                clearTimeout(inactivityTimeout);
            }

            function stop() {
                inactivityModal = undefined;
                pause();
            }

            return {
                start: start,
                stop: stop
            }

        })();

        // check for changes in batches so that summary table is up to date
        var batchStatusTracker = (function (window) {
            var currentTimeout;
            var pollingDelay = window.global_batch_status_check_debounce_ms;

            function triggerStatusCheck() {

                batchUploadService.getAllBatches(true).then(function (batches) {
                    vm.batches = batches;
                    vm.reloadData();

                    currentTimeout = window.setTimeout(function () {
                        $scope.$apply(function () {
                            triggerStatusCheck();
                        });
                    }, pollingDelay);
                });
            }

            function start() {
                if (!currentTimeout) {
                    triggerStatusCheck();
                }
            }

            function stop() {
                window.clearTimeout(currentTimeout);
                currentTimeout = undefined;
            }

            return {
                start: start,
                stop: stop
            }

        })($window);

        function displayBasicMessageModal(title, messages, callback) {
            
            var modalInstance = $modal.open({
                templateUrl: 'app/admin/batchupload/messageModal.html',
                resolve: {},
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.messages = getMessages(messages);
                    $scope.title = title;

                    $scope.ok = function () {
                        $modalInstance.dismiss('cancel');
                        if (typeof callback === "function") {
                            callback();
                        }
                    };

                    function getMessages(messages) {
                        if (typeof messages === "object" && messages.length) {
                            return messages;
                        } else {
                            return [messages];
                        }
                    }
                }]
            });
        }

        init();
    }
})();