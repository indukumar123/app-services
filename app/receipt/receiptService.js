(function () {
    'use strict';

    angular.module('agentPortal')
        .service('receiptService', [ 'storage', receiptService]);

    /**
    * @ngdoc controller
    * @name receiptService
    *
    * # receiptService
    *
    * @description
    * service to support display of receipt of policy purchased
    */
    function receiptService(storage) {
        
        /**
         * @description
         * public functions exposed by this service
         */
        return {
            storeReceiptState: storeState,
            retrieveReceiptState: retrieveState            
        };

        /**
         * @description
         * retrieves the receipt policy data from storage
         */
        function retrieveState() {
            return storage.get('receipt.state');
        };

        /**
         * @description
         * stores the receipt policy data in storage
         */
        function storeState(state) {
            storage.set('receipt.state', state);
        }
    }
})();