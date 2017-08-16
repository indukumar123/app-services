/**
 * @ngdoc directive
 * @name ngPrint
 *
 * # ngPrint
 *
 * @description
 * Print directive to perform printing  for policy receipts etc
 */

(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('ngPrint', ['$window', bhtpPrintDirective]);

    function bhtpPrintDirective($window) {
        var printSection = document.getElementById('printSection');

        // if there is no printing section, create one
        if (!printSection) {
            printSection = document.createElement('div');
            printSection.id = 'printSection';
            document.body.appendChild(printSection);
        }

        return {
            link: link,
            restrict: 'A'
        };

        function link(scope, element, attrs) {
            element.on('click', function () {
                var elemToPrint = document.getElementById(attrs.printElementId);
                if (elemToPrint) {
                    fillPrintSection(elemToPrint);
                    $window.print();
                }
            });

            $window.onafterprint = function () {
                // clean the print section before adding new content
                printSection.innerHTML = '';
            };
        }

        function fillPrintSection(elem) {
            printSection.innerHTML = '';
            // clones the element you want to print
            var domClone = elem.cloneNode(true);
            printSection.appendChild(domClone);
        }
    }
}());