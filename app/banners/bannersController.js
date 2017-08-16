(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name bannersController
     *
     * # bannersController
     *
     * @description
     * provides functions behind banner ads page
     */

    angular.module('agentPortal')
        .controller('bannersController', ['bannersService', 'utilService', bannersController]);

    function bannersController(bannersService, utilService) {
        var vm = this;

        vm.current = null;
        vm.bannerAds = [];

        vm.getCode = function (index) {
            vm.current = vm.bannerAds[index];
        };

        var init = function () {
            bannersService.get()
            .then(function (resp) {
                vm.bannerAds = resp;
            })
            .catch(function (error) {
                utilService.showPopup('Error', 'Something went wrong while attempting to retrieve the banner ads. Please try again later.');
            });
        };

        init();
    }
})();