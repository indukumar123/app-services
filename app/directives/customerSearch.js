(function () {

    angular
        .module('agentPortal')
        .directive('customerSearch', customerSearch);

    function customerSearch() {
        var directive = {
            restrict: 'EA',
            scope: {
                agentId: '=',
                packageId: '=',
                updateCustomer: '='
            },
            templateUrl: 'app/layout/customerSearch.html',
            replace: true,
            bindToController: true,
            controllerAs: 'vm',
            controller: customerSearchController,
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            var vm = scope.vm;
            $("#txtcustomerDetail").focus();

            scope.$watch('vm.customerSearchText', function (newVal, oldVal) {
                if (newVal !== undefined) {
                    if (newVal.length > 0) {
                        vm.btnClass = "activebtn";
                    }
                    if (newVal.length === 0) {
                        vm.btnClass = "disablebtn";
                    }
                }
            });
        }
    }

    customerSearchController.$inject = ['$modal', 'customersService'];

    function customerSearchController($modal, customersService) {
        var vm = this;

        vm.getCustomerDetail = function (formValid) {
            if (formValid) {
                vm.customerNotFoundErrorMessage = null;
                customersService.loadCustomerDetail(vm.agentId, vm.customerSearchText).then(function (results) {
                    if (results.customers.length == 0) {
                        vm.customerNotFoundErrorMessage = 'No record found.';
                    }
                    else if (results.customers.length > 1) {
                        vm.showCustomers(results.customers);
                    }
                    if (results.customers.length == 1) {
                        vm.customerSelected = true;
                        vm.showCustomerSearch = false;
                        loadCustomer(results.customers[0].customerId).then(function (customerData) {
                            vm.showCustomerSearch = false;
                            vm.customerSearchText = '';
                            vm.updateCustomer(customerData);
                        });
                    }
                }, function (error) {
                    deferredPromise.reject(error);
                });
            }
        }

        function loadCustomer(customerId) {
            return customersService.getById(customerId);
        };

        vm.showCustomers = function (tempCustomers) {
            vm.customers = tempCustomers;
            vm.customers.selectedPackageId = vm.packageId;
            var modalInstance = $modal.open({
                templateUrl: 'app/layout/customers.html',
                backdrop: true,
                windowClass: 'modal',
                resolve: {
                    customers: function () {
                        return vm.customers;
                    }
                },
                controller: ['$scope', '$modalInstance', 'customers', function ($scope, $modalInstance, customers, selectedPackageId) {
                    $scope.customers = customers;
                    $scope.selectCustomer = function (row) {
                        $modalInstance.close(row);
                    }
                    $scope.close = function (row) {
                        $modalInstance.close('dismiss');
                    }
                }]
            });
            modalInstance.result.then(function (paramFromDialog) {
                if (paramFromDialog == 'dismiss') {
                    vm.isDisabled = false;
                }
                else {
                    vm.customerSelected = true;
                    vm.showCustomerSearch = false;
                    loadCustomer(paramFromDialog.customerId).then(function (customerData) {
                        vm.showCustomerSearch = false;
                        vm.customerSearchText = '';
                        vm.updateCustomer(customerData);
                    });
                }
            });
        }

    }

})();
