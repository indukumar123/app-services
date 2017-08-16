(function () {
    'use strict';

    /**
     * @ngdoc factory
     * @name productService
     *
     * # productService
     *
     * @description
     * API integration for products page with the backend
     */
    angular.module('agentPortal')
        .service('nonMerchantPolicies', ['$resource', '$q', '$http', nonMerchantPolicies]);

    var policySummaryPaginationUrl = '/apiproxyv2/bhtp/v1/UploadResults/:uploadId/:page/:rows/:sorts/:errorsOnly';
    var uploadedPoliciesUrl = '/apiproxyv2/bhtp/v1/UploadResults/Summaries';
    var uploadedPolicySummaryUrl = '/apiproxyv2/bhtp/v1/UploadResults/:uploadId/:returnLines';
    var policySummaryPagination = '/apiproxyv2/bhtp/v1/UploadResults/:uploadId/:pageNumber/:rowNumber/:sortBy/:errorsOnly';
    var exportUploadedPolicyUrl = '/apiproxyv2/bhtp/v1/PolicyUpload/Pickup/:uploadId';

    function nonMerchantPolicies($resource, $q, $http) {
        return {
            getPoliciesUploaded: getPoliciesUploaded,
            getPolicyDetails: getPolicyDetails,
            getPolicyLineDetails:getPolicyLineDetails,
            getPolicyPaginationDetail: getPolicyPaginationDetail,
            getExportUploadedPolicy: getExportUploadedPolicy
        };

        /**
        * @description
        * retrieves a list of policies
        */
        function getPoliciesUploaded() {
            var policiesApi = $resource(uploadedPoliciesUrl, {}, { get: { method: 'GET', isArray: true } });
            return policiesApi.get().$promise;
        }

        /**
        * @description
        * retrieves details of a policy
        */
        function getPolicyDetails(uploadId, returnLines) {
            var policyApi = $resource(uploadedPolicySummaryUrl, {uploadId: uploadId, returnLines: returnLines}, { get: { method: 'GET', isArray: false } });
            return policyApi.get().$promise;
        }

        /**
        * @description
        * retrieves line details of a policy upload
        */
        function getPolicyLineDetails(uploadId, returnLines) {
            var policyApi = $resource(uploadedPolicySummaryUrl, { uploadId: uploadId, returnLines: returnLines }, { get: { method: 'GET', isArray: false } });
            policyApi.get().$promise.then(function (results) {
                return results.lineItems;
            });
        }

        /**
        * @description
        * retrieves pagination information details of a policy upload
        */
        function getPolicyPaginationDetail(uploadId, pageNumber, rowNumber, sortBy, errorsOnly) {
            var policyApi = $resource(policySummaryPagination, { uploadId: uploadId, pageNumber: pageNumber, rowNumber: rowNumber, sortBy: sortBy, errorsOnly: errorsOnly }, { get: { method: 'GET', isArray: false } });
            return policyApi.get().$promise;
        }

        /**
        * @description
        * exports a policy upload
        */
        function getExportUploadedPolicy(uploadId, errorsOnly) {
            var deferred = $q.defer();
            var url = '/apiproxyv2/bhtp/v1/PolicyUpload/Pickup/' + uploadId;

            if (errorsOnly === true) {
                url += '/errors';
            }

            $http.get(url)
                .then(function (result) {
                    deferred.resolve(result.data);
                });

            return deferred.promise;
        }
    }
})();
