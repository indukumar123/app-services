/**
 * @ngdoc directive
 * @name ngImagePreview
 *
 * # ngImagePreview
 *
 * @description
 * Print directive to perform printing  for policy receipts etc
 */

(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('bhtpImagePreview', [bhtpImagePreview]);

    function bhtpImagePreview() {
        return {
            link: link,
            restrict: 'E',
            template: '<div class="image-preview-container" ng-mouseover="onMouseEnter($event, imageHeight, imageWidth)"ng-mouseleave="onMouseLeave()"><p>Preview</p><span class="image-preview"><img ng-src="{{imageSource}}" /></span></div>',
            transclude: true,
            scope: {
                imageSource: '@',
                imageWidth: '@',
                imageHeight: '@'
            }
        };

        function link(scope, element, attrs) {
            // Find the display paragraph so we get get it's width
            var paragraph = element.find('p');

            // Find span that contain's image to apply the css positioning
            var preview = element.find('.image-preview');

            // Set position of span 
            preview.css({
                top: element.position().top - (scope.imageHeight / 1),
                left: paragraph.left + paragraph.outerWidth()
            });
        }
    }
}());