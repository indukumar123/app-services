(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name format
     *
     * # messageDisplayService
     *
     * @description
     * a set of functions used for displaying and dealing with acknowledgements.
     */
    angular.module('agentPortal')
        .factory('messageDisplayService', ['$modal', '$q', messageDisplayService]);

    messageDisplayService.$inject = ['$modal', '$q'];

    function messageDisplayService($modal, $q) {
        /**
         * shows the user a modal and all errors/acknowledgements returned from eligibility.
         *
         * @return {Promise} 
         * The returned promise will resolve when the user has clicked a button and closed the modal.
         *
         * @param {object[]} apiErrorMessages 
         * the array of api error message objects to display to the user.
         *
         * @param {void function(object acknowledgement)} onAcceptAcknowledgementCallback 
         * the method to call when an acknowledgement is accepted.  The accepted acknowledgements will be passed in.
         */
        this.promptUserWithMessageModal = function (apiErrorMessages, recommendation, onAcknowledgementsAcceptedCallback) {
            var deferredPromise = $q.defer();

            // open a modal and present all error messages and acknowledgements to the user.
            var modalInstance = openErrorMessageModal(apiErrorMessages, recommendation, onAcknowledgementsAcceptedCallback, deferredPromise);

            return deferredPromise.promise;
        };

        /**
         * Shows the user a modal with the acknowledgement's message, for display only.
         * This is intended to display an acknowledgement that the user already accepted.
         * @return {void}
         *
         * @param {object} acknowledgement 
         * the acknowledgement object whose message will display to the user.
         */
        this.displayAcknowledgementViewOnly = function (acknowledgement) {
            // open a modal and show the acknowledgement to the user (view-only, for previously accepted acknowledgements).
            openModalForViewingAcceptedAcknowledgement(acknowledgement);
        };

        function openErrorMessageModal(apiErrorMessages, recommendation, onAcknowledgementsAcceptedCallback, onCompletedPromise) {
            // configure modal settings.
            var settings = new acknowledgementModalOptions();

            settings.title = 'Eligibility Check Failed';
            settings.apiErrorMessages = apiErrorMessages;
            settings.acknowledgementsAcceptedCallback = onAcknowledgementsAcceptedCallback;
            settings.onCompletedPromise = onCompletedPromise;
            settings.continueButtonText = 'Continue';

            // do some overrides on settings if we received a recommendation for package switching.
            if (recommendation) {
                settings.buttonAreaPromptMessage = recommendation.prompt;
                settings.continueButtonText = recommendation.confirm;
                settings.cancelButtonText = recommendation.dismiss;

                // if a recommendation exists, show the recommendation and no error messages.
                // clear the other error messages here.
                settings.apiErrorMessages = [recommendation.apiErrorMessage];
            }

            var modalInstance = $modal.open({
                templateUrl: 'app/messages/messageModal.html',
                controller: 'messageModalController',
                controllerAs: 'vm',
                transclude: true,

                // sets a class to the modal dialog window. used to 
                //  put the dynamically added modal at the same location as the ones
                //  that are always at the top of the <body>'s child list.
                windowClass: 'bhtp-custom-modal-window',

                // disallow closing the modal if the user clicks outside of it
                backdrop: 'static',

                // disallow closing the modal if the user hits ESC.
                keyboard: 'false',
                resolve: {
                    modalSettings: function () { return settings; }
                }
            });

            return modalInstance;
        }

        function openModalForViewingAcceptedAcknowledgement(acknowledgement) {
            // configure modal settings.
            var settings = new acknowledgementModalOptions();

            settings.title = 'Acknowledgements';
            settings.notificationMessage = acknowledgement.message;
            settings.continueButtonText = 'Ok';

            var modalInstance = $modal.open({
                templateUrl: 'app/messages/messageModal.html',
                controller: 'messageModalController',
                controllerAs: 'vm',
                transclude: true,

                // sets a class to the modal dialog window. used to 
                //  put the dynamically added modal at the same location as the ones
                //  that are always at the top of the <body>'s child list.
                windowClass: 'bhtp-custom-modal-window',
                resolve: {
                    modalSettings: function () { return settings; }
                }
            });

            return modalInstance;
        }


    return this;
}

})();