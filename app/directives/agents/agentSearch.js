/*global angular */
/*jshint globalstrict: true*/

(function () {
    'use strict';
    var searchAgentsByNameUrl = '/APIProxyV2/BHTP/clients/v1/agents/name/';
    var searchAgentsByCodeUrl = '/APIProxyV2/BHTP/clients/v1/agents/code/';

    /**
     * @ngdoc directive
     * @name airlineAutoComplete
     * @description
     * directive to perform type-ahead for airlines 
     */
    angular.module('agentPortal')
        .directive('agentSearch', ['$rootScope', function ($rootScope) {
            return {
                require: 'ngModel',
                scope: {
                    agent: '=',
                    displayKey: '@',
                    onSelected: '&?agentOnSelected',
                },
                link: function ($scope, $elem, $attrs) {

                    var inUpdate = false,
                        lastSelected = null,
                        updateAgent = function (agent) {
                            inUpdate = true;
                            $scope.$apply(function () {
                                $scope.agent = JSON.parse(JSON.stringify(agent));
                            });
                            inUpdate = false;
                        };
                    
                    if ($attrs.displayKey == 'name') {
                        $scope.lookupUrl = searchAgentsByNameUrl;
                    }
                    else {
                        $scope.lookupUrl = searchAgentsByCodeUrl;
                    }
                    $scope.onSelected = function ()
                    {
                        return $scope.agent;
                    }

                    $($elem).typeahead({
                        name: $elem.attr('name'),
                        valueKey: 'displayName',
                        limit: 8,
                        remote: {
                            url: $scope.lookupUrl + '%QUERY',
                            beforeSend: function (jqXhr, settings) {
                                jqXhr.setRequestHeader("X-Bhtp-Origin", 'agents.bhtp.com');
                                jqXhr.setRequestHeader("Authorization", 'Bearer ' + localStorage.getItem('idToken'));
                            },
                            filter: function (response) {
                                var ret = $.map(response.response, function (a) {
                                    if ($attrs.displayKey == 'name') {
                                        a.displayName = a.agentName + " (" + a.agentCode + ")";
                                    }
                                    else {
                                        a.displayName = a.agentCode;
                                    }
                                    return a;
                                });
                                return ret;
                            }
                        }
                    }).on("typeahead:selected", function (e, a) {
                        lastSelected = a;
                        updateAgent(a);
                        var inputs = $(this).closest('form').find(':input:enabled');
                        inputs.eq(inputs.index(this) + 1).focus();
                    }).on("typeahead:autocompleted", function (e, a) {
                        lastSelected = a;
                        updateAgent(a);
                        var inputs = $(this).closest('form').find(':input:enabled');
                        inputs.eq(inputs.index(this) + 1).focus();
                    });

                    $scope.$watch("agents.displayName", function (code) {
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
