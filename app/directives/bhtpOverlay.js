(function() {

    /**
     * @ngdoc directive
     * @name bhtpOverlayDirective
     *
     * # bhtpOverlayDirective
     *
     * @description
     * spinner / loading animation directive for all actions requiring communicatino with the backend
     */
    var bhtpOverlayDirective = function($q, $timeout, $window, $rootScope, httpInterceptor) {
        return {
            restrict: 'EA',
            transclude: true,
            scope: {
                bhtpOverlayDelay: "@"
            },

            template: '<div id="overlay-container" class="overlayContainer">' +
                '<div id="overlay-background" class="overlayBackground"></div>' +
                '<div id="overlay-content" class="overlayContent" data-ng-transclude>' +
                '</div>' +
                '</div>',
            link: function(scope, element, attrs) {
                var overlayContainer = null,
                    timerPromise = null,
                    timerPromiseHide = null,
                    queue = [];

                init();

                function init() {
                    wireUpEvents();
                    wireUpHttpInterceptor();
                    overlayContainer = element[0].firstChild; //Get to template
                }

                function wireUpEvents() {
                    $rootScope.$on('showOverlay', showOverlay);
                    $rootScope.$on('hideOverlay', hideOverlay);
                }

                //Hook into httpInterceptor factory request/response/responseError functions                
                function wireUpHttpInterceptor() {
                    httpInterceptor.request = function (config) {
                        if (!(typeof config.noQueue === "boolean" && config.noQueue)) {
                            processRequest();
                        }

                        return config || $q.when(config);
                    };

                    httpInterceptor.response = function(response) {
                        processResponse();
                        return response || $q.when(response);
                    };

                    httpInterceptor.responseError = function(rejection) {
                        processResponse();
                        return $q.reject(rejection);
                    };
                }

                //Monitor jQuery Ajax calls in case it's used in an app
                function wirejQueryInterceptor() {
                    $(document).ajaxStart(function() {
                        processRequest();
                    });

                    $(document).ajaxComplete(function() {
                        processResponse();
                    });

                    $(document).ajaxError(function() {
                        processResponse();
                    });
                }

                /**
                  * @description
                  * shows animation to indicate that communication with server is taking place
                  */
                function processRequest() {
                    queue.push({});
                    if (queue.length == 1) {
                        timerPromise = $timeout(function() {
                            if (queue.length) showOverlay();
                        }, scope.bhtpOverlayDelay ? scope.bhtpOverlayDelay : 500); //Delay showing for 500 millis to avoid flicker
                    }
                }

                /**
                  * @description
                  * shows animation to indicate that communication with server is taking place
                  */
                function processResponse() {
                    queue.pop();
                    if (queue.length == 0) {
                        //Since we don't know if another XHR request will be made, pause before
                        //hiding the overlay. If another XHR request comes in then the overlay
                        //will stay visible which prevents a flicker
                        timerPromiseHide = $timeout(function() {
                            //Make sure queue is still 0 since a new XHR request may have come in
                            //while timer was running
                            if (queue.length == 0) {
                                hideOverlay();
                                if (timerPromiseHide) $timeout.cancel(timerPromiseHide);
                            }
                        }, scope.bhtpOverlayDelay ? scope.bhtpOverlayDelay : 500);
                    }
                }

                /**
                  * @description
                  * displays animated panel on the center of the screen
                  */
                function showOverlay() {
                    var $loading = $("#overlay-content");
                    var windowH = $(window).height();
                    var windowW = $(window).width();

                    $loading.css({
                        left: ((windowW - $loading.outerWidth()) / 2 + $(document).scrollLeft()),
                        top: ((windowH - $loading.outerHeight()) / 2 + $(document).scrollTop())
                    });

                    overlayContainer.style.display = 'block';
                }

                /**
                  * @description
                  * hides the overlay display to mark completion of the communication activity with backend
                  */
                function hideOverlay() {
                    if (timerPromise) $timeout.cancel(timerPromise);
                    overlayContainer.style.display = 'none';
                }
            }
        };
    };

    var agentPortalApp = angular.module('agentPortal');

    //Empty factory to hook into $httpProvider.interceptors
    //Directive will hookup request, response, and responseError interceptors
    agentPortalApp.factory('httpInterceptor', function() {
        return {};
    });

    //Hook httpInterceptor factory into the $httpProvider interceptors so that we can monitor XHR calls
    agentPortalApp.config(['$httpProvider', function($httpProvider) {
            $httpProvider.interceptors.push('httpInterceptor');
        }
    ]);

    //Directive that uses the httpInterceptor factory above to monitor XHR calls
    //When a call is made it displays an overlay and a content area 
    //No attempt has been made at this point to test on older browsers
    agentPortalApp.directive('bhtpOverlay', ['$q', '$timeout', '$window', '$rootScope', 'httpInterceptor', bhtpOverlayDirective]);

}());