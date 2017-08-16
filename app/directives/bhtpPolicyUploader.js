(function () {
    'use strict';
    angular.module('agentPortal')
        .directive('bhtpPolicyUploader', bhtpPolicyUploader)
    function bhtpPolicyUploader() {
        return {
            restrict: 'EA',
            templateUrl: 'app/admin/policies/bhtpPolicyUploader.html',
            controller: bhtpPolicyUploaderCtrl,
            controllerAs: 'vm',
            bindToController: true
        };
    }

    bhtpPolicyUploaderCtrl.$inject = ['Upload', 'portalService', '$state', 'nonMerchantPolicies', '$q'];
    function bhtpPolicyUploaderCtrl(Upload, portalService, $state, nonMerchantPolicies, $q) {
        var vm = this;
        vm.acceptedFileTypes = ".csv";
        vm.maxFileSizeInBytes = 11000000;
        vm.maxFileSizeInMb = vm.maxFileSizeInBytes / 1000000;
        vm.maxFileSizeInKb = vm.maxFileSizeInBytes / 1000;
        vm.errorMessage = '';
        vm.fileNamesDisplay = '';
        var token = localStorage.getItem('idToken');

        vm.upload = function upload() {
            for (var i = 0; i < vm.filesToUpload.length; i++) {
                uploadFile(vm.filesToUpload[i]);
            }
        }

        /**
        * @description
        * grid action for exporting csv
        */
        vm.exportUpload = function getCustomFilters(uploadId) {
            var upload = null;
            var deferredPromise = $q.defer();
            nonMerchantPolicies.getPolicyDetails(uploadId, false).then(function (result) {
                upload = result;
                if (upload)
                {
                    generateFile(result);
                }
                deferredPromise.resolve(result);
            });
            return deferredPromise.promise;
        }

        function generateFile(upload)
        {
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

        function uploadFile(file) {
            portalService.getAgentByInternalId().then(function (agent) {
                vm.uploader = Upload.upload({
                    url: '/APIProxyV2/BHTP/v1/PolicyUpload/' + ((agent.agentId).substring(0,15)),
                    file: file,
                    data: {},
                    headers: { 'Authorization': 'Bearer ' + token },
                    filename: file.name
                }).progress(function (evt) {
                    file.progress = parseInt(100.0 * evt.loaded / evt.total);
                    file.progressDisplay = file.progress + "%";
                }).then(function (result, status, headers, config) {
                    file.uploadId = result.data.uploadId;
                }).catch(function (errorResponse) {
                    if (errorResponse.data) {
                        file.error = errorResponse.data.Message;
                    } else {
                        file.error = 'An unknown error has occured while uploading the file.';
                    }
                });
            });
        }

        vm.storeFiles = function (files) {
            vm.filesToUpload = files;
            vm.fileNamesDisplay = '';
            prepareFilesToUpload();
        }

        vm.validate = function validate(file) {
            var errors = '';
            if (file) {
                errors = validateFileType(file.name);
                errors += validateFileSize(file.size, file.name);
            }
            return errors;
        }

        vm.clearStoredFiles = function clearStoredFiles(shouldLeave) {
            vm.filesToUpload = null;
            vm.fileNamesDisplay = '';

            if (shouldLeave) {
                vm.doneUploading();
            }
        }

        vm.removeFile = function removeFile(index) {
            vm.filesToUpload.splice(index, 1);
            vm.fileNamesDisplay = '';
            updateFileNamesDisplay();
        }

        vm.abortUpload = function abortUpload() {
            vm.uploader.abort();
        }

        vm.uploadDisabled = function uploadDisabled() {
            var isDisabled = false;
            if (vm.filesToUpload && vm.filesToUpload.length > 0) {
                for (var i = 0; i < vm.filesToUpload.length; i++) {

                    if (vm.filesToUpload[i].error) {
                        isDisabled = true;
                        break;
                    }

                    if (vm.filesToUpload[i].progress && vm.filesToUpload[i].progress > 1) {
                        isDisabled = true;
                        break;
                    }
                }
            } else {
                isDisabled = true;
            }

            return isDisabled;
        }

        vm.doneUploading = function doneUploading() {
            $state.go('adminPolicyManagement');
        }

        function validateFileType(fileName) {
            var filteredFileName = fileName.toLowerCase();
            if (filteredFileName.indexOf('.csv') > -1) {
                return '';
            } else {
                return fileName + ' is the incorrect file type. Please upload a file type of ' + vm.acceptedFileTypes + '. ';
            }
        }

        function validateFileSize(fileSize, fileName) {
            if (fileSize > vm.maxFileSizeInBytes) {
                return fileName + ' is too large: ' + fileSize / 1000 + 'KB. The max file size is ' + vm.maxFileSizeInKb + 'KB.';
            } else {
                return '';
            }
        }

        function prepareFilesToUpload() {
            if (vm.filesToUpload) {
                for (var i = 0; i < vm.filesToUpload.length; i++) {
                    vm.filesToUpload[i].sizeInKb = (vm.filesToUpload[i].size / 1000).toFixed(2) + 'KB';
                    vm.filesToUpload[i].error = vm.validate(vm.filesToUpload[i]);
                }
                updateFileNamesDisplay();
            }
        }

        function updateFileNamesDisplay() {
            if (vm.filesToUpload) {
                for (var i = 0; i < vm.filesToUpload.length; i++) {
                    vm.fileNamesDisplay += (vm.fileNamesDisplay == '' ? '' : ', ') + vm.filesToUpload[i].name;
                }
            }
        }
    }
})();