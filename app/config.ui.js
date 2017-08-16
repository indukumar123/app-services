(function() {
    'use strict';

/**
 * @ngdoc config
 * @name datepickerConfig
 *
 * # datepickerConfig
 *
 * @description
 * configuration for date pickers across the board
 */
   
    angular.module('agentPortal')
        .config(['datepickerConfig', 'datepickerPopupConfig', 'settings', uiConfig]);

    function uiConfig(datepickerConfig, datepickerPopupConfig, settings) {
        datepickerConfig.showWeeks = false;
        datepickerPopupConfig.showButtonBar = false;
        datepickerPopupConfig.datepickerPopup = settings.date.format;
        datepickerPopupConfig.closeOnDateSelection = true;
    }
})();
