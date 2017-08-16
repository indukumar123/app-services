var acknowledgementModalOptions = function () {
    this.title = null;
    this.apiErrorMessages = [];
    this.acknowledgementsAcceptedCallback = null;
    this.notificationMessage = null;
    this.onCompletedPromise = null;

    // the message that displays just above the modal's button(s)
    this.buttonAreaPromptMessage = null;

    this.continueButtonText = null;
    this.cancelButtonText = null;
};

(function () {
    'use strict';

    angular.module('agentPortal')
        .controller('messageModalController', messageModalController);

    // $modalInstance comes from the $modal.open() method.  The rest are resolved in the $modal.open() method's
    //  resolve property.
    messageModalController.$inject = ['$modalInstance', 'modalSettings', 'format'];

    /**
     * controls the flow within the modal that presents acknowledgements to the user.
     *
     * @param {object} $modalInstance
     * The instance of the modal created by $modal (bootstrap modal service). Will be injected.
     *
     * @param {object[]} apiErrorMessages
     * An array of apiErrorMessages objects to present to the user.
     *
     * @param {void function(acceptedAcknowledgements[])} acceptAcknowledgementCallback
     * A function to invoke when an acknowledgement is accepted by the user.
     *
     * @param {string} continueText
     * The text to show in the confirm button. Defaults to 'Continue' if null.
     */
    function messageModalController($modalInstance, modalSettings, format) {
        var vm = this;

        // the list of accepted acknowledgements.
        vm.acceptedAcknowledgements = [];

        vm.titleText = function () {
            return modalSettings.title;
        };

        vm.buttonAreaPromptMessage = function () {
            return modalSettings.buttonAreaPromptMessage;
        };

        vm.continueButtonText = function () {
            return modalSettings.continueButtonText || 'Continue';
        };

        vm.cancelButtonText = function () {
            return modalSettings.cancelButtonText || null;
        };

        vm.hasCancelButtonText = function () {
            return vm.cancelButtonText() !== null;
        };

        vm.tripMessage = function () {
            // consistency with new consumer. not currently implemented.
            return null;
        }

        vm.messages = function () {
            return modalSettings.apiErrorMessages || [];
        }

        vm.formattedNotificationMessage = function () {
            return format.formatDisplayMessage(modalSettings.notificationMessage);
        };

        vm.continueClicked = function () {
            // do stuff. accept the acks, etc.
            // get the accepted acknowledgements?

            if (modalSettings.acknowledgementsAcceptedCallback) {
                // pass the accepted acknowledgements into the callback method, if there are any.
                if (vm.acceptedAcknowledgements && vm.acceptedAcknowledgements.length > 0) {
                    modalSettings.acknowledgementsAcceptedCallback(vm.acceptedAcknowledgements);
                }
            }

            vm.closeModal(true);
        };

        vm.closeModal = function (wasContinueClicked) {
            // dismiss the modal.
            $modalInstance.close();

            // resolve the promise.
            if (modalSettings.onCompletedPromise) {
                modalSettings.onCompletedPromise.resolve({
                    acknowledgementsWereAccepted: vm.acceptedAcknowledgements.length > 0,
                    continueButtonWasClicked: wasContinueClicked ? true : false
                });
            }

            return;
        };

        vm.onAcknowledgementAccepted = function (acceptedAcknowledgement) {
            // add this acknowledgement to the list of accepted acknowledgements.
            vm.acceptedAcknowledgements.push(acceptedAcknowledgement);
        };

        vm.onAcknowledgementUnaccepted = function (unacceptedAcknowledgement) {
            // remove this acknowledgement from the list of accepted acknowledgements, if it was found.
            var indexOfAckToRemove = vm.acceptedAcknowledgements.indexOf(unacceptedAcknowledgement);

            if (indexOfAckToRemove > -1) {
                vm.acceptedAcknowledgements.splice(indexOfAckToRemove, 1);
            }
        };

        function getFormattedMessage(message) {
            return message.replace(/\\n/gi, '<br />');
        }
    }
}());