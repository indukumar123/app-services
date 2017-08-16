(function () {
    'use strict';

    angular
        .module('agentPortal')
        .constant('productRatingIds', {
            micro: "1",
            traditional: "2",
            vacationGuard: "3"
        })
        .constant('paymentMethods', {
            invoice: 'invoice',
            prepaid: 'prepaid'
        });

})();