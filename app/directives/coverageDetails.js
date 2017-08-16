(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('coverageDetails', [coverageDetailsDirective])
    function coverageDetailsDirective() {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                docUrl: '@',
                coverages: '='
            },

            link: function (scope, element, attrs) {

                scope.buttonText = "View Coverages";
                var changeButtonText = true;

                $(document).ready(function () {
                    setCoverageDetailsHiddenTop();
                    setCoverageDetailsLeft();
                });

                $(window).resize(function () {
                    if (changeButtonText) {
                        setCoverageDetailsHiddenTop();
                    } else {
                        setCoverageDetailsShowTop();
                    }
                    setCoverageDetailsLeft();
                    setCoverageBodyMaxHeight();
                });

                scope.toggleDetails = function () {
                    
                    changeButtonText = !changeButtonText;
                    if (changeButtonText) {
                        scope.buttonText = "View Coverages";
                        setCoverageDetailsHiddenTop();
                    } else {
                        scope.buttonText = "Hide Coverages";
                        setCoverageDetailsShowTop();
                        setCoverageBodyMaxHeight();
                    }
                }

                function setCoverageDetailsShowTop() {
                    $('.overlayBottom').css({ 'top': '60%'});
                }

                function setCoverageDetailsHiddenTop(){
                    var windowHeight = $(window).height();
                    var buttonHeight = $('#toggleCoverages').outerHeight(true);

                    var topHeight =  (windowHeight - buttonHeight) - 3;

                    $('.overlayBottom').css({ 'top': (topHeight + 'px') });
                }

                function setCoverageDetailsLeft() {
                    var sidebarWidth = $("#sidebar").outerWidth(true);

                    if (sidebarWidth == null || $("#sidebar").is(":hidden")) {
                        sidebarWidth = 0;
                    }

                    $('.overlayBottom').css({ 'left': (sidebarWidth + 'px') });
                }

                function setCoverageBodyMaxHeight() {
                    var windowHeight = $(window).height();
                    var containerHeight = $('.overlayBottom').position();
                    var coverageBodyPos = $('#coverageBody').position();
                    var coverageFooter = $('#coverageFooter').outerHeight(true);
                    if (coverageBodyPos && containerHeight) {
                        var maxHeight = windowHeight - containerHeight.top - coverageBodyPos.top - coverageFooter;
                        $("#coverageBody").css({ "max-height": (maxHeight + 'px') });
                    }
                }
            },

            templateUrl: 'app/layout/coverageDetails.html'
        };
    }
}());