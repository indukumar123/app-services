(function () {
    angular.module('agentPortal')
        .directive('bhtpMask', ['$rootScope', function ($rootScope) {
            return {
                require: 'ngModel',
                link: function ($scope, $elem, $attrs) {
                    if (!(window.sessionStorage.getItem("isCustomSession") == 'true')) {
                        if ($attrs.bhtpMaskType) {
                            $($elem).inputmask($attrs.bhtpMaskType, JSON.parse($attrs.bhtpMask));
                        }
                        else {
                            $($elem).inputmask($attrs.bhtpMask);
                        }
                    }
                }
            };
        }]);
})();