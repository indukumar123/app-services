(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name contactController
     *
     * # contactController
     *
     * @description
     * provides functions behind contact us form
     */

    angular.module('agentPortal')
        .controller('contactController', ['portalService','contactService', 'utilService', 'intentService', contactController]);

    function contactController(portalService, çontactService, utilService, intentService) {
        var vm = this;
        vm.contactCategories = [];
        vm.selectedContact = '';
        vm.mailContent = '';
        vm.contacts = [];

        vm.agent = {};

        /**
         * @description
         * posts the contact us form to server, there by sending the email to the concerned party.
         */
        vm.sendMail = function () {
            console.log(vm.selectedContact);
            console.log(vm.mailContent);
            intentService.setIntent("Submiting...");
            çontactService.sendContactRequest(vm.selectedContact.value, vm.mailContent).then(function () {
                intentService.resetIntent();
                vm.selectedContact = '';
                vm.mailContent = '';
                utilService.showPopup("Message", "Thank you "+ vm.agent.firstName+" for contacting us, we'll reach out to you shortly.");
            }, function (error) {
                intentService.resetIntent();
                console.warn("Failed while submiting the contact-us form %o", error);
                utilService.showPopup("Message", "Oops! Something went wrong, please try again later.");
            });
        };


        /**
         * @description
         * initialization activities ...
         */
        function init() {
            vm.title = 'Contact Us';

            portalService.getAgentByInternalId().then(function (agent) {
                vm.agent = agent;
            });

            //load categories of questions from the API
            çontactService.loadCategoryInfo().then(function (result) {
                vm.contactCategories = [];
                for (var i = 0; i < result.data.length; i++) {
                    var item = result.data[i];
                    vm.contactCategories.push({
                        name: item.title.trim(),
                        value: item.content.trim()
                    });
                }
            }, function(error) {
                console.warn("Failed while submiting the contact-us form %o", error);
                utilService.showPopup("Error", "Failed while retrieving the categories.");
            });

            //get static list of contacts by question-categories to display on the side.
            çontactService.getContacts().then(function (contacts) {
                $.each(contacts, function (i, contact) {
                    var tokens = contact.content.split("|");
                    contact.email = tokens[0];
                    contact.phone = tokens[1];
                });
                intentService.resetIntent();
                vm.contacts = contacts;
            }, function(error) {
                intentService.resetIntent();
                console.warn("Failed while submiting the contact-us form %o", error);
                utilService.showPopup("Message", "Oops! Something went wrong, please try again later.");
            });
        }

        init();
    }
})();