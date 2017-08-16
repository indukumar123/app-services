(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('batchUploadService', ['$resource', '$http', '$q', 'tableHelper', batchUploadService]);

    var clientsApiBaseUrl = '/APIProxyV2/BHTP/clients/';
    var getBatchesUrl = clientsApiBaseUrl + 'v1/Batch/List';
    var getBatchUrl = clientsApiBaseUrl + 'v1/Batch/:batchId';
    var getBatchStatusUrl = clientsApiBaseUrl + 'v1/Batch/:batchId/Status';
    var saveBatchUrl = clientsApiBaseUrl + 'v1/Batch/Save';
    var getTemplateUrl = clientsApiBaseUrl + 'v1/Batch/Template/:templateName';
    var rateBatchRowUrl = clientsApiBaseUrl + 'v1/Batch/RateLine';
    var submitBatchUrl = clientsApiBaseUrl + 'v1/Batch/Submit';
    var uploadFileUrl = clientsApiBaseUrl + 'v1/Batch/Upload';
    var reportActivityUrl = clientsApiBaseUrl + 'v1/Batch/:batchId/ExtendLock';
    var unlockBatchUrl = clientsApiBaseUrl + 'v1/Batch/:batchId/Unlock';
    var downloadTemplateUrl = clientsApiBaseUrl + 'v1/Batch/Template/Download/:templateName';

    function batchUploadService($resource, $http, $q, tableHelper) {
        return {
            getAllBatches: getAllBatches,
            saveBatch: saveBatch,
            rateBatchRow: rateBatchRow,
            getContentTemplate: getContentTemplate,
            submitBatch: submitBatch,
            getBatchById: getBatchById,
            getBatchStatus: getBatchStatus,
            processFile: processFile,
            reportUserActivity: reportUserActivity,
            unlockBatch: unlockBatch,
            downloadTemplate: downloadTemplate,
        };

        /**
         * @description
         * gets all batches for the agency
         */
        function getAllBatches(noQueue) {
            var deferredPromise = $q.defer();

            $http.get(getBatchesUrl, { noQueue: noQueue })
                .then(function (results) {
                    if (!results.data.response) {
                        return deferredPromise.reject(results.data);
                    }

                    deferredPromise.resolve(results.data.response);
                }, function (error) {
                    deferredPromise.reject(error);
                });

            return deferredPromise.promise;
        }

        /**
         * @description
         * saves batch to the API
         */
        function saveBatch(batch) {
            return saveOrSubmit(batch, saveBatchUrl);
        }

        function submitBatch(batch) {
            return saveOrSubmit(batch, submitBatchUrl);
        }

        function saveOrSubmit(batch, url) {
            var deferredPromise = $q.defer();
            var postData = buildSavePostDataFromBatch(batch);

            $http.post(url, postData)
                .then(function (result) {
                    if (result.data && result.data.response) {
                        deferredPromise.resolve(unpackSaveResponse(result.data.response));
                    } else {
                        deferredPromise.reject(result.data ? result.data.response : result.data);
                    }
                }).catch(function (data, status) {
                    var responseData = data;

                    if (data.data) {
                        responseData = data.data;
                    }

                    deferredPromise.reject(responseData, status);
                });

            return deferredPromise.promise;
        }

        function rateBatchRow(row) {
            var deferredPromise = $q.defer();
            var postData = row.data;

            $http.post(rateBatchRowUrl, postData, { noQueue: true })
                .then(function (result) {
                    if (result.data && result.data.messages) {
                        deferredPromise.resolve(result.data);
                    } else {
                        deferredPromise.reject(result.data);
                    }
                }).catch(function (data, status) {
                    var responseData = data;

                    if (data.data) {
                        responseData = data.data;
                    }

                    deferredPromise.reject(responseData, status);
                });

            return deferredPromise.promise;
        }

        function unpackSaveResponse(responseBatch) {
            responseBatch.rows.forEach(function (row, index) {
                responseBatch.rows[index] = {
                    "batchRowId": row.batchRowId,
                    "batchId": row.batchId,
                    "status": row.status,
                    data: row
                };

                delete row.batchRowId;
                delete row.batchId;
                delete row.correlationId;
                delete row.deleted;
            });

            return responseBatch;
        }

        function buildSavePostDataFromBatch(batch) {

            var postData = {
                "batchId": batch.batchId,
                "batchName": batch.batchName,
                "deleted": batch.deleted,
                "rows": []
            };

            if (batch.rows) {
                batch.rows.forEach(function (row, index) {
                    // Only process populated rows
                    if (tableHelper.rowIsPopulated(row)) {
                        //We need to "clone" the row, so we don't alter the original
                        var flatRow = JSON.parse(JSON.stringify(row.data));

                        // Add batchId to model
                        flatRow.batchId = postData.batchId;

                        // Add correlationId if a new row, add batchRowId if it was existing
                        if (!row.batchRowId) {
                            if (!row.correlationId) {
                                console.log("No Row Id or correlation Id found when saving row");
                            } else {
                                flatRow.correlationId = row.correlationId;
                            }
                        } else {
                            flatRow.batchRowId = row.batchRowId
                        }

                        if (flatRow.policyNumber && flatRow.policyNumber.display) {
                            flatRow.policyNumber = flatRow.policyNumber.display;
                        }

                        // Add flat row model to post data
                        postData.rows.push(flatRow);
                    }
                });
            }

            return postData;
        }

        function getBatchById(batchId) {
            var deferredPromise = $q.defer();

            $resource(getBatchUrl, { batchId: batchId }).get().$promise
                .then(function (data) {
                    if (data.response) {
                        deferredPromise.resolve(unpackSaveResponse(data.response));
                    } else {
                        deferredPromise.reject(data);
                    }
                }, function (data, status) {
                    deferredPromise.reject(data);
                });

            return deferredPromise.promise;
        }

        function getBatchStatus(batchId) {
            var deferredPromise = $q.defer();
            var url = getBatchStatusUrl.replace(":batchId", batchId);
            $http.get(url, { noQueue: true })
                .then(function (response) {
                    if (response.data.response) {
                        deferredPromise.resolve(response.data.response);
                    } else {
                        deferredPromise.reject(response);
                    }
                }, function (data, status) {
                    deferredPromise.reject(data);
                });

            return deferredPromise.promise;
        }
        
        function getContentTemplate(templateName) {
            return $resource(getTemplateUrl, { templateName: templateName }).get().$promise;
        }

        function processFile(file, batchId) {
            var deferredPromise = $q.defer();
            var formData = new FormData();
            var url = uploadFileUrl;

            formData.append('file', file);

            var config = {
                headers: {
                    'Content-Type': undefined, // Header needs to be cleared so it can be set by the browser
                }
            }

            if (batchId) {
                url += "/" + batchId;
            }

            $http.post(url, formData, config)
                .then(function (response) {
                    deferredPromise.resolve({
                        batch: unpackSaveResponse(response.data.response),
                        messages: response.data.messages
                    });
                }, function (response) {
                    if (response && response.data) {
                        deferredPromise.reject(response.data);
                    }
                    deferredPromise.reject();
                    console.log("upload failed");
                });
            return deferredPromise.promise;
        }

        function reportUserActivity(batchId) {
            var deferredPromise = $q.defer();
            var url = reportActivityUrl.replace(":batchId", batchId);
            $http.patch(url,undefined, { noQueue: true })
                .then(function (response) {
                    if (response.data.response) {
                        deferredPromise.resolve(response.data.response);
                    } else {
                        deferredPromise.reject(response.data);
                    }
                }, function (data, status) {
                    deferredPromise.reject(data);
                });

            return deferredPromise.promise;
        }

        function unlockBatch(batchId) {
            var deferredPromise = $q.defer();
            var url = unlockBatchUrl.replace(":batchId", batchId);
            $http.patch(url)
                .then(function (response) {
                    if (response.data.response) {
                        deferredPromise.resolve(response.data.response);
                    } else {
                        deferredPromise.reject(response.data);
                    }
                }, function (data, status) {
                    deferredPromise.reject(data);
                });

            return deferredPromise.promise;
        }
        
        function downloadTemplate(templateName) {
            var deferredPromise = $q.defer();
            var url = downloadTemplateUrl.replace(":templateName", templateName);
            $http.get(url)
                .then(function (response) {
                    if (response.data) {
                        deferredPromise.resolve(response.data);
                    } else {
                        deferredPromise.reject(response.data);
                    }
                }, function (data, status) {
                    deferredPromise.reject(data);
                });

            return deferredPromise.promise;
        }
    }
})();