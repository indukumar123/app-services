(function () {

    angular
        .module('agentPortal')
        .directive('paymentIFrame', paymentIFrame);

    function paymentIFrame() {
        return {
            restrict: 'E',
            scope: {
                storagePrefix: '@',
                state:'=',
                callback: '=',
                errors: '='
            },
            templateUrl: 'app/quotes/purchase/paymentForm.html',
            bindToController: true,
            controllerAs: 'paymentCtrl',
            controller: PaymentFormController
        };
    }
    
    PaymentFormController.$inject = ['$sce', 'intentService', 'storage', 'portalService'];

    function PaymentFormController($sce, intentService, storage, portalService) {

        var vm = this;
        vm.title = 'Enter Payment Info';

        vm.reloadIframe = function () {
            vm.errors = null;
            vm.iframeSrc = "about:blank";
            init();
        };

        function init() {
            intentService.setIntent("Loading Payment form ...");

            if (vm.state.policy) {
                // if there's a policy number, we're editing
                if (vm.state.policyNumber) {
                    vm.state.policy.policy.address = vm.state.policy.policy.policyAddress;
                    vm.addressSource = vm.state.policy.policy;
                }
            }
            
            // get the current logged in agent, incase the user did not provide an email address
            var agent = null;
            portalService.getAgentByInternalId()
                .then(function (response) {
                    agent = response;
                })
                .finally(function () {
                    vm.iframeSrc = $sce.trustAsResourceUrl(getIframeUrl(basePaymentUrl, agent));
                    setupResponseListener();
                });

        }

        function getIframeUrl(url, agent) {
            var queryParams = '?';

            // simplify only accepts a single line address
            var address = sortOutTheAddress();

            // if there's no state provided, they might make it through payment without providing a state,
            // which breaks purchase and is bad in general, so force them to enter a billing address
            if (address.stateOrProvince) {
                queryParams += 'address=' + encodeURIComponent(valOrEmptyString(address.address));
                queryParams += '&state=' + encodeURIComponent(valOrEmptyString(address.stateOrProvince));
            }
            else {
                queryParams += 'address='
            }

            queryParams += '&city=' + encodeURIComponent(valOrEmptyString(address.city));
            queryParams += '&zip=' + encodeURIComponent(valOrEmptyString(address.postalCode));

            // pass the logged in agent's email address to the payment form when no email has been provided 
            // by the primary traveler. This is a work around for a bug with the simplify form
            var paramEmail = address.email;

            if (!paramEmail && agent) {
                paramEmail = agent.emailAddress;
            }

            // fall back to agent@bhtp.com if the agent's email address is null
            queryParams += '&email=' + encodeURIComponent(valOrEmptyString(paramEmail ? paramEmail : 'agent@bhtp.com'));

            queryParams += '&name=' + encodeURIComponent(valOrEmptyString(address.name));
            queryParams += '&saveTokenForPayments=false&buttonText=Complete%20Purchase';

            url += queryParams;
            return url;
        }

        function sortOutTheAddress() {
            var address = {};
             if (vm.addressSource) {
                address.address = vm.addressSource.address.address1;
                address.city = vm.addressSource.address.city;
                address.stateOrProvince = vm.addressSource.address.stateOrProvince;
                address.postalCode = vm.addressSource.address.postalCode;
                address.email = vm.addressSource.emailAddress;
                if (vm.addressSource.primaryTravelerName) {
                    address.name = valOrEmptyString(vm.addressSource.primaryTravelerName);
                } else {
                    address.name = valOrEmptyString(vm.addressSource.firstName) + ' ' + valOrEmptyString(vm.addressSource.lastName);
                }
             } else {
                 address.address = vm.state.billing.address1;
                 if (address.address && vm.state.billing.address2 && vm.state.billing.address2 !== '') {
                     address.address = address.address + ' ' + vm.state.billing.address2;
                 }

                 address.city = vm.state.billing.city;
                 address.stateOrProvince = vm.state.billing.stateOrProvince;
                 address.postalCode = vm.state.billing.postalCode;
                 address.email = vm.state.billing.email;
                 address.name = vm.state.billing.name;
             }

            return address;
        }

        function valOrEmptyString(val) {
            if (val == null || val == undefined) {
                return '';
            }
            return val
        }

        function windowListener (e) {
            if (e.data) {
                var key = e.message ? 'message' : 'data';
                var data = e[key];
                if (data) {
                    if (data.card) {
                        vm.state.billing = {
                            email: data.email,
                            paymentToken: data.cardToken,
                            address1: data.card.addressLine1,
                            city: data.card.addressCity,
                            stateOrProvince: data.card.addressState,
                            postalCode: data.card.addressZip,
                            name: data.card.name,
                            expMonth: data.card.expMonth,
                            expYear: data.card.expYear,
                            last4: data.card.last4,
                            cardType: data.card.type
                        };
                        storage.set(vm.storagePrefix + '.state', vm.state);
                        vm.callback();
                    }
                }
            }
        };

        function setupResponseListener() {
            window.onmessage = windowListener;
        }

        init();
    }
})();