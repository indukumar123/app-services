(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('bhtpAutoComplete', [bhtpAutoCompleteDirective])
        .directive('batchTypeahead', [batchTypeaheadDirective]);

    function getScope() {
        return {
            entity: '=',
            displayKey: '@',
            idKey: '@',
            disallowFreeForm: '=',
            hideError: '=',
            modelValue: '=ngModel'
        };
    }

    function getLink($scope, $elem, $attrs, $ctrl, attributeProp, watchModel) {
        var localChange = false;

        var selectEntity = function (e, entity) {
            $ctrl.$setValidity('invalid', true);

            $scope.$apply(function () {
                localChange = true;
                $scope.entity = entity;
                var newValue = entity[$scope.displayKey];
                $elem.val(newValue);
                $scope.modelValue = newValue;
            });
        };

        $($elem).typeahead({
            name: $elem.attr('name'),
            valueKey: $scope.displayKey,
            limit: 50,
            remote: {
                url: $attrs[attributeProp].replace(":query", '%QUERY'),
                filter: function (response) {
                    var ret = $.map(response, function (a) {
                        a.id = a[$scope.idKey];
                        return a;
                    });
                    return ret;
                }
            }
        })
        .on("typeahead:selected", selectEntity)
        .on("typeahead:autocompleted", selectEntity);


        $elem.bind('input', function () {
            $scope.$apply(function () {
                localChange = true;
                var value = $elem.val();

                $ctrl.$setValidity('invalid', true);

                $scope.entity = {};
                $scope.entity.id = null;
                $scope.entity[$scope.displayKey] = value;

                if (value == "")
                    return;

                if ($scope.disallowFreeForm && $scope.entity.id == null && !$scope.hideError) {
                    $ctrl.$setValidity('invalid', false);
                }
            });
        });

        // Updates typeahead when entity changed.
        $scope.$watch('entity', function (newVal) {
            if (!newVal)
                return;

            if (!localChange) {
                var valueKey = $scope.displayKey;
                if (newVal.hasOwnProperty(valueKey)) {
                    newVal = newVal[valueKey];
                }
                $($elem).typeahead('setQuery', newVal || '');
            } else {
                localChange = false;
            }
        });

        if (watchModel === true) {
            $scope.$watch("modelValue", function (newModelValue) {
                if (localChange) {
                    return;
                }
                if (!newModelValue) {
                    newModelValue = '';
                }

                $($elem).typeahead("setQuery", newModelValue);
            });
        }
    }

    /**
     * @ngdoc directive
     * @name bhtpAutoCompleteDirectvie
     *
     * # bhtpAutoCompleteDirectvie
     *
     * @description
     * generic utility directive for type-ahead functions required on primarily complete-care module
     */
    function bhtpAutoCompleteDirective() {
        return {
            scope: getScope(),
            require: 'ngModel',
            link: function ($scope, $elem, $attrs, $ctrl) {
                getLink($scope, $elem, $attrs, $ctrl, 'bhtpAutoComplete', false);
            }
        };
    }

    function batchTypeaheadDirective() {
        return {
            scope: getScope(),
            require: 'ngModel',
            link: function ($scope, $elem, $attrs, $ctrl) {
                getLink($scope, $elem, $attrs, $ctrl, 'batchTypeahead', true);
            }
        };
    }
}());