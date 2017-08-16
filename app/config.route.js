(function () {
    'use strict';

    /**
     * @ngdoc config
     * @name $stateProvider
     *
     * # $stateProvider
     *
     * @description
     * routes configuration across the board 
     */

    angular.module('agentPortal')
        .config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', routeConfig])
        .config(['$provide', function ($provide) {
            if (window.sessionStorage.DisableHistory) {
                $provide.decorator('$sniffer', ['$delegate', function ($delegate) {
                    $delegate.history = false;
                    return $delegate;
                }])
            }
        }]);

    /*
     * Optional Route Configs:
     * 
     * allowAmbassador: whether or not a user with a role of ambassador can access the page.
     * persistState: whether or not to allow the state (i.e. WI) should be kept in memory on that page.
     * preventBack: prevents a user from navigating backwards to the previous page, such as from a receipt page.
     * requiresLogin: requires the app user to be authenticated
     */

    function routeConfig($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider, $injector) {

        $urlRouterProvider.otherwise(function ($injector) {
            var $state = $injector.get('$state');
            var authenticationNavigationService = $injector.get('authenticationNavigationService');
            authenticationNavigationService.checkToken().then(function (data) {
                if (data) {
                    $state.go('dashboard');
                }
            });
        });
        $urlMatcherFactoryProvider.strictMode(false);
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('dashboard',
            {
                url: '/dashboard',
                templateUrl: 'app/dashboard/dashboard.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                },
            })
            .state('purchase',
            {
                url: '/purchase',
                templateUrl: 'app/purchase/purchase.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('purchasePackage',
            {
                url: '/purchase/package/:ratingId',
                templateUrl: 'app/purchase/purchase.html',
                params: {
                    'sessionId': { value: null }
                },
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('purchaseCustomer',
            {
                url: '/purchase/customer/:customerId/:page?',
                templateUrl: 'app/purchase/purchase.html',
                params: {
                    'sessionId': { value: null }
                },
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('purchasePackageQuote',
            {
                url: '/purchase/package/:ratingId/quote/:quoteId/:page?',
                templateUrl: 'app/purchase/purchase.html',
                params: {
                    'sessionId': { value: null }
                },
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('purchasePackageCustomer',
            {
                url: '/purchase/package/:ratingId/customer/:customerId/:page?',
                templateUrl: 'app/purchase/purchase.html',
                params: {
                    'sessionId': { value: null }
                },
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('purchaseBHTP',
            {
                url: '/purchase/ratingId/:ratingId?customerId&quoteId&page',
                templateUrl: 'app/purchase/purchasePath.html',
                params: {
                    'sessionId': { value: null }
                },
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('receiptBHTP',
            {
                url: '/receipt/:policyNumber',
                templateUrl: 'app/purchase/receipt.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true,
                    preventBack: true
                }
            })
            .state('quotes',
            {
                url: '/quotes',
                templateUrl: 'app/quotes/quotes.html',
                controller: 'quotesController',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('quotesView',
            {
                url: '/quotes/view/:quoteNumber',
                templateUrl: 'app/quotes/quote.detail.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('products',
            {
                url: '/products',
                templateUrl: 'app/products/productsV2.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('tramsproducts',
            {
                url: '/products',
                templateUrl: 'app/products/productsV2.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('productsCustomerPage',
            {
                url: '/products/customer/:customerId/:page?',
                templateUrl: 'app/products/productsV2.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                }
            })
            .state('customers',
            {
                url: '/customers',
                templateUrl: 'app/customers/customers.html',
                controller: 'customersController',
                data: {
                    requiresLogin: true
                }
            })
            .state('customersEdit',
            {
                url: '/customers/edit/:customerId',
                templateUrl: 'app/customers/customer.detail.html',
                requiresLogin: true,
                data: {
                    requiresLogin: true
                }
            })
            .state('policiesFilter',
            {
                url: '/policies/:filter?',
                templateUrl: 'app/policies/policies.html',
                data: {
                    requiresLogin: true
                }
            })
            .state('policiesEdit',
            {
                url: '/policies/edit/:policyNumber',
                templateUrl: 'app/policyedit/policyedit.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('policiesEditStep',
            {
                url: '/policies/edit/step/:step?',
                templateUrl: 'app/policyedit/policyedit.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('policiesEditReceipt',
            {
                url: '/policies/edit/receipt/:policyNumber',
                templateUrl: 'app/receipt/receipt.html',
                controller: 'policyEditReceiptController',
                controllerAs: 'vm',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    preventBack: true
                }
            })
            .state('policiesView',
            {
                url: '/policies/view/:policyNumber',
                templateUrl: 'app/policies/policy.detail.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('login',
            {
                url: '/login',
                templateUrl: 'app/auth/login.html',
                data: {
                    allowAmbassador: true
                }
            })
            .state('loginForgot',
            {
                url: '/login/forgot',
                templateUrl: 'app/auth/forgot.html',
            })
            .state('logout',
            {
                url: '/logout',
                templateUrl: 'app/auth/login.html',
                controller: 'logoutController',
                data: {
                    allowAmbassador: true
                }
            })
            .state('profile',
            {
                url: '/profile',
                templateUrl: 'app/agent/profile.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('training',
            {
                url: '/training',
                templateUrl: 'app/training/training.html',
                data: {
                    requiresLogin: true
                }
            })
            .state('contact',
            {
                url: '/contact',
                templateUrl: 'app/contact/contact.html',
                data: {
                    requiresLogin: true
                }
            })
            .state('faq',
            {
                url: '/faq',
                templateUrl: 'app/faq/faq.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                }
            })
            .state('banners',
            {
                url: '/banners',
                templateUrl: 'app/banners/banners.html',
                data: {
                    requiresLogin: true
                },
                controller: 'bannersController',
                controllerAs: 'vm'
            })
            .state('errorAmbassador',
            {
                url: '/error/ambassador',
                templateUrl: 'app/layout/ambassadorerror.html',
                data: {
                    requiresLogin: true
                }
            })
            .state('adminPolicyManagement',
            {
                url: '/admin/policyManagement',
                templateUrl: 'app/admin/policies/policyManagement.html',
                data: {
                    requiresLogin: true,
                    canPayWithInvoice: true,
                },
                controller: 'policyManagementController',
                controllerAs: 'vm'
            })
            .state('adminPolicyManagementUpload',
            {
                url: '/admin/policyManagement/upload',
                templateUrl: 'app/admin/policies/uploadPolicies.html',
                data: {
                    requiresLogin: true,
                    canPayWithInvoice: true,
                },
                controller: 'policyManagementController',
                controllerAs: 'vm'
            })
            .state('adminPolicyManagementPolicyDetail',
            {
                url: '/admin/policyManagement/policyDetail/:uploadId',
                templateUrl: 'app/admin/policies/policyUploadDetails.html',
                data: {
                    requiresLogin: true,
                    canPayWithInvoice: true,
                },
                controller: 'policyUploadDetailsController',
                controllerAs: 'vm'
            })
            .state('adminBatchUpload',
            {
                url: '/admin/batchUpload',
                templateUrl: 'app/admin/batchUpload/batchUpload.html',
                data: {
                    requiresLogin: true,
                },
                controller: 'batchUploadController',
                controllerAs: 'vm'
            })
            .state('adminVerifyPoints',
            {
                url: '/admin/verifyPoints',
                templateUrl: 'app/admin/quotes/rewardQuotes.html',
                data: {
                    requiresLogin: true,
                    canUsePoints: true,
                },
                controller: 'rewardQuotesController',
                controllerAs: 'vm'
            })
            .state('adminVerifyPointDetails',
            {
                url: '/admin/verifyPointDetails/:quoteNumber',
                templateUrl: 'app/admin/quotes/rewardQuoteDetail.html',
                data: {
                    requiresLogin: true,
                    canUsePoints: true,
                },
                controller: 'rewardQuoteDetailController',
                controllerAs: 'vm'
            })
            .state('admin',
            {
                url: '/admin',
                templateUrl: 'app/admin/admin.html',
                data: {
                    requiresLogin: true
                },
                controller: 'admin',
                controllerAs: 'vm'
            })
            .state('adminManageAgents',
            {
                url: '/admin/manageAgents',
                templateUrl: 'app/admin/agents/manageAgents.html',
                data: {
                    requiresLogin: true
                },
                controller: 'manageAgentsController',
                controllerAs: 'vm'
            })
            .state('adminManageAgentsView',
            {
                url: '/admin/manageAgents/view/:agentId',
                templateUrl: 'app/admin/agents/agentDetail.html',
                data: {
                    requiresLogin: true
                },
                controller: 'agentDetailController',
                controllerAs: 'vm'
            })
            .state('adminManageAgentsCreate',
            {
                url: '/admin/manageAgents/create',
                templateUrl: 'app/admin/agents/agentDetail.html',
                data: {
                    requiresLogin: true
                }
            })
            .state('partnerProducts',
            {
                url: '/partnerProducts',
                templateUrl: 'app/products/partnerProducts.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                }
            })
            .state('quickquoteCustomerAmbassador',
            {
                url: '/quickquote/customers/:customerId/agent/?',
                templateUrl: 'app/quickquote/quickQuote.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                },
                controller: 'quickQuotesController',
                controllerAs: 'vm'
            })
            .state('quickquoteCustomerPage',
            {
                url: '/quickquote/customer/:customerId/:page?',
                templateUrl: 'app/quickquote/quickQuote.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true
                },
                controller: 'quickQuotesController',
                controllerAs: 'vm'
            })
            .state('quickquote',
            {
                url: '/quickquote?customerId&agentCode&requestId&action',
                templateUrl: 'app/quickquote/quickQuote.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                },
                controller: 'quickQuotesController',
                controllerAs: 'vm'
            })
            .state('fnolSummary',
            {
                url: '/fnol/summary',
                templateUrl: 'app/fnol/fnol.summary.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true
                },
                controller: 'fnolSummaryController',
                controllerAs: 'vm'
            })
            .state('fnol',
            {
                url: '/fnol/:policyNumber',
                templateUrl: 'app/fnol/fnol.html',
                data: {
                    requiresLogin: true,
                    allowAmbassador: true,
                    persistState: true,
                },
                controller: 'fnolController',
                controllerAs: 'vm'
            })
            // Someday we should include an action, edit, purchase, etc as a parameter.  In this way
            // Sales Force will only ever need to know about on deep link url and the agent portal can direct from there
            .state('ambassadorlaunchpad',
                {
                    url: '/ambassador?customerId&agentCode&requestId&action',
                    templateUrl: 'app/shared/ambassadorLaunchpad.html',
                    data: {
                        requiresLogin: true,
                        allowAmbassador: true,
                        persistState: true,
                        preventBack: true
                    },
                    controller: 'ambassadorLaunchpadController',
                    controllerAs: 'vm'
                });
    }
})();
