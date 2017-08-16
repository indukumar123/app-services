(function() {
    'use strict';

    /**
     * @ngdoc directive
     * @name bhtpTodosDirective
     *
     * # bhtpTodosDirective
     *
     * @description
     * directive for displaying TODOs information on dashboard as well as training pages
     */
    angular.module('agentPortal')
        .directive('bhtpTodosDirective', ['todoService','utilService',bhtpTodosDirective]);
    
    function bhtpTodosDirective(todoService, utilService) {
        return {
            restrict: 'EA',
            scope: {
                title: '=',
                config: '=',
                selectedProduct: '=',
                productList: '=',
                loadData: '&',
                todos: '='
            },
            templateUrl: 'app/directives/todo/bhtpTodosDirective.html',
            link: function (scope, el, attr) {
                scope.$watch('selectedProduct', function (newValue) {
                    if (newValue) {
                        load(newValue);
                    }
                });

                /**
                 * @description
                 * click function for individual TODOItem, to mark it completed
                 */
                scope.todoClicked = function (todo) {
                    if (todo.complete) {
                        window.open(todo.link);
                    } else {
                        var promise = todoService.postCompleted(todo.taskId);
                        promise.then(function(response) {
                            if (response.completedDate != null) {
                                todo.complete = true;
                                window.open(todo.link);
                            } else {
                                console.warn("Error while marking the task complete. %o", response);
                                utilService.showPopup("Error", "Error while marking the task complete.");
                            }
                        }, function(error) {
                            console.warn("Error while marking the task complete. %o", error);
                            utilService.showPopup("Error", "Error while marking the task complete. " + error.message);
                        });
                    }
                };

                /**
                 * @description
                 * determines which icon to show for given TODOItem
                 */
                scope.getGlyph = function (todo) {
                    var glyph = '';

                    if (!todo || !todo.mediaType) {
                        console.writeln("Ooops, returning blank glyph .. for %o", todo);
                        return glyph;
                    }

                    if (todo.complete) {
                        glyph = 'fa fa-check-circle';
                        return glyph;
                    }

                    switch (todo.mediaType.toLowerCase()) {
                        case "image":
                            glyph = "fa fa-file-text";
                            break;
                        case "video":
                            glyph = "fa fa-play-circle";
                            break;
                        case "document":
                            glyph = "fa fa-file-text";
                            break;
                        case "audio":
                            glyph = "fa fa-music";
                            break;
                        default:
                            glyph = '';
                            break;
                    }
                    console.log("returning glyph .. for "+todo.mediaType+" ... "+glyph);
                    return glyph;
                };
                
                /**
                 * @description
                 * loads TODOItems for given package
                 */
                function load(selectedPackage) {
                    scope.loadData().then(function(items) {
                        if (items.exceptionMessage != null) {
                            console.warn("Error while retrieving todo items for " + selectedPackage.name + " %o", items);
                            utilService.showPopup("Error", "Error while loading todo items for " + selectedPackage.name + ". " + items.exceptionMessage);
                        } else {
                            scope.todos = items;
                        }
                    }, function (error) {
                        console.warn("Error while loading todo items for " + selectedPackage.name + " %o", error);
                            utilService.showPopup("Error", "Error while loading todo items for " + product);
                    });
                }

                function init() {
                    scope.selectedProduct = scope.productList[0];
                }

                init();
            }
        };
    }
})();


    
        