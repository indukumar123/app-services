(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name statePersister
     *
     * # statePersister
     *
     * @description
     * manages the the state (i.e. WI) context in a central location if something needs to store or retrieve it
     */
    angular.module('agentPortal')
        .service('statePersister', [function() {
            
            var self = this;
            self.stateCode = null;

            self.persist = function (stateCode) {
                self.stateCode = stateCode;
            };

            self.retrieve = function () {
                return self.stateCode;
            }

            self.destroy = function () {
                self.stateCode = null;
            };
        }]);
})();
