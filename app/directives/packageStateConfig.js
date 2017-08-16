/**
 * @ngdoc directive
 * @name packageStateConfig
 *
 * # packageStateConfig
 *
 * @description
 * when the value changes, this directive will go out and get the matching the package state configuration to apply validation and update error messages
 */

(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('packageStateConfig', ['eligibilityService', packageStateConfig]);

    function packageStateConfig(eligibilityService) {
        return {
            restrict: 'A',
            scope: {
                pscRatingid: '=',
                pscConfig: '=',
                pscErrors: '=',
                pscStateName: '='
            },
            link: function (scope, element, attrs) {
                element.on('change', function () {
                    eligibilityService.getPackageStateConfiguration(element[0].value, scope.pscRatingid).then(function (data) {
                        scope.pscConfig = data;
                        scope.pscConfig.selectedStateName = scope.pscStateName;
                        eligibilityService.setPackageStateConfigurationMessages(scope.pscErrors, scope.pscConfig);
                    });
                });
            }
        };
    }
}());