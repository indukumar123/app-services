/*global angular */
/*jshint globalstrict: true*/

(function () {
    'use strict';
    var airlineLookupUrl = "/proxy/bhtp/api/Eligibility/Provider/Search/";
    var limit = 50;

    /**
     * @ngdoc directive
     * @name airlineAutoComplete
     *
     * # airlineAutoComplete
     *
     * @description
     * directive to perform type-ahead for airlines 
     */
    angular.module('agentPortal')
        .directive('airlineAutocomplete', ['$rootScope', function ($rootScope) {
            return {
                require: 'ngModel',
                scope: {
                    airline: '='
                },
                link: function ($scope, $elem, $attrs) {
                    var inUpdate = false,
                        lastSelected = null,
                        updateAirline = function (airline) {
                            inUpdate = true;
                            $scope.$apply(function () {
                                $scope.airline = JSON.parse(JSON.stringify(airline));
                            });
                            inUpdate = false;
                        };

                    $($elem).typeahead({                        
                        name: 'airlines',
                        valueKey: 'displayName',
                        limit: limit,
                        remote: {
                            url: airlineLookupUrl + '%QUERY/airline?limit=' + limit,
                            filter: function (response) {
                                var ret = $.map(response, function (a) {
                                    // copying provider code due to switch to calling eligibility directly
                                    a.code = a.providerCode;
                                    a.displayName = a.name + " (" + a.code + ")";
                                    return a;
                                });
                                return ret;
                            }
                        }
                    }).on("typeahead:selected", function (e, a) {
                        lastSelected = a;
                        updateAirline(a);
                        var inputs = $(this).closest('form').find(':input:enabled');
                        inputs.eq(inputs.index(this) + 1).focus();
                    }).on("typeahead:autocompleted", function (e, a) {
                        lastSelected = a;
                        updateAirline(a);
                        var inputs = $(this).closest('form').find(':input:enabled');
                        inputs.eq(inputs.index(this) + 1).focus();
                    });

                    $scope.$watch("airline.displayName", function (code) {
                        if (inUpdate) {
                            return;
                        }
                        if (code === undefined) {
                            code = "";
                        }
                        if (code != null && code.length > 0) {
                            $($elem).typeahead("setQuery", code);
                        }
                    });
                }
            };
        }]);
})();
