(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name utilService
     *
     * # utilService
     *
     * @description
     * has utility functions to show popup messages, dates processing, etc
     */
    angular.module('agentPortal')
        .service('utilService', ['$rootScope', 'settings', 'googletagmanager', 'portalService', utilService]);

    function utilService($rootScope, settings, googletagmanager, portalService) {

        return {
            isMatchingAny: isMatchingAny,
            isDateInRange: isDateInRange,
            getDateRange: getDateRange,
            showPopup: showPopup,
            showMessagePopup: showMessagePopup,
            showConfirmPopup: showConfirmPopup,
            showConfirmWithOptionsPopup: showConfirmWithOptionsPopup,
            showCanSell: showCanSell,
            sendPrimaryTravelerToZeroIndex: sendPrimaryTravelerToZeroIndex,
            getLocalDateDisplayString: getLocalDateDisplayString,
            setConstants: setConstants,
            setVmMasks: setVmMasks,
            isAircare: isAircare,
            trim: trim,
            showConfirmPrimaryTraveler: showConfirmPrimaryTraveler,
            getTraditionalRatingIds: getTraditionalRatingIds,
            getAircareRatingIds: getAircareRatingIds,
            splitFullNameOnCard: splitFullNameOnCard,
            showConfirmWithOptionsPopupNoMessages: showConfirmWithOptionsPopupNoMessages,
            getMessageWithCode: getMessageWithCode,
            isOddNumber: isOddNumber,
            isOddIndexNumber: isOddIndexNumber
        };

        /**
         * @description
         * gets date range for the given interval
         */
        function getDateRange(interval) {

            var now = moment(new Date());

            if (interval == 'All') {
                return null;
            }

            var fromDate = null, toDate = null;

            switch (interval) {
                case "0":
                    toDate = now;
                    fromDate = now.clone();
                    break;
                case "1":
                    toDate = now.clone();
                    fromDate = now.clone().subtract(toDate.format("E") - 1, 'days');
                    break;
                case "2":
                    toDate = now.clone();
                    fromDate = now.subtract(toDate.format("D") - 1, 'days');
                    break;
                case "3":
                    toDate = now.clone().subtract(now.format("D"), 'days');
                    fromDate = toDate.clone().subtract(toDate.format("D") - 1, 'days');
                    break;
                case "4":
                    toDate = now.clone();
                    fromDate = now.clone().subtract(now.format("DDD") - 1, 'days');
                    break;
                default: break;
            }

            fromDate.startOf('day');
            toDate.endOf('day');

            return {
                startDate: fromDate,
                endDate: toDate
            };
        }

        /**
         * @description
         * returns true if date value is within given date range, indicated by start and end date
         */
        function isDateInRange(dateValue, startDate, endDate) {
            //var date = new Date(dateValue);
            var isOk = dateValue >= startDate && dateValue <= endDate;
            return isOk;
        }

        /**
         * @description
         * returns true if string match is performed amongst given set of fields
         */
        function isMatchingAny(fields, stringValue) {
            if (stringValue == "") {
                return true;
            }
            for (var i = 0; i < fields.length; i++) {
                if (containsString(fields[i], stringValue))
                    return true;
            }
            return false;
        }

        /**
         * @description
         * returns true if given value is contained within given string
         */
        function containsString(stringToSearch, searchValue) {
            if (stringToSearch == null) return false;
            return stringToSearch.toLowerCase().indexOf(searchValue) > -1;
        }

        /**
         * @description
         * shows error message dialog popup
         */
        function showPopup(title, message, customIcon) {
            //            $('#popupmsg').on('hidden.bs.modal', function (e) {
            //                $rootScope.popupMessage = "";
            //            });
            if (!customIcon) {
                customIcon = 'fa-exclamation-circle fa-icon-medium fa-icon-error';
            }

            $rootScope.popup = {
                title: title != null ? title : "Message",
                message: message,
                icon: customIcon
            };
            $('#popupmsg').modal('toggle');
            googletagmanager.purchasePathError(message);
        }

        /**
         * @description
         * shows message dialog popup
         */
        function showMessagePopup(title, message, iconToUse) {
            
            $rootScope.popup = {
                title: title != null ? title : "Message",
                message: message,
                icon: iconToUse != null && typeof iconToUse !== "undefined" ? iconToUse : 'fa fa-exclamation-circle fa-icon-medium'
            };
            $('#popupmsg').modal('toggle');
        }

        /**
         * @description
         * shows confirmation message dialog popup
         */
        function showConfirmPopup(title, message, yes, no) {
            $rootScope.confirm = {
                title: title != null ? title : "Message",
                message: message,
                yes: yes != null ? yes : "Yes",
                no: no != null ? no : "No",
            };
            $('#popupconfirm').modal('toggle');
        }

        /**
         * @description
         * shows confirmation message with options
         */
        function showConfirmWithOptionsPopup(title, mainmessage, messages, buttons) {
            $rootScope.confirmoptions = {
                title: title != null ? title : "Message",
                mainmessage: mainmessage,
                messages: messages,
                modalbuttons: buttons,
            };
            $('#popupconfirmwithoptions').modal('toggle');
        }

         /**
         * @description
         * shows confirmation message with options, but no additional messages
         */
        function showConfirmWithOptionsPopupNoMessages(title, mainmessage, buttons) {
            $rootScope.confirmoptions = {
                title: title != null ? title : "Message",
                mainmessage: mainmessage,
                modalbuttons: buttons,
            };
            $('#popupconfirmwithoptionsnomessages').modal('toggle');
        }

        /**
         * @description
         * shows confirmation message for the modal to confirm agent override
         */
        function showCanSell(residenceLocation, showsendquote, buttons) {
            $rootScope.cansell = {
                residenceLocation: residenceLocation,
                showsendquote: showsendquote,
                modalbuttons: buttons
            };
            $('#popupcansell').modal('toggle');
        }


        /**
         * @description
         * finds the primary traveler in the collection and moves it to the 0 index
         */
        function sendPrimaryTravelerToZeroIndex(travelers) {
            for (var i in travelers) {
                if (travelers[i].isPrimary == true) {
                    var primaryTraveler = travelers[i];
                    travelers.splice(i, 1);
                    travelers.splice(0, 0, primaryTraveler);
                    break;
                }

                i += 1;
            }
        }

        /**
         * @description
         * shows primary traveler dialog popup
         */
        function showConfirmPrimaryTraveler(title, message, buttons) {
            $rootScope.primaryTraveler = {
                title: title != null ? title : "Message",
                message: message,
                modalbuttons: buttons
            };
            $('#popupprimaryconfirm').modal('toggle');
        }

        function setConstants(vm) {
            setVmMasks(vm);
            vm.errors = settings.errors;
            vm.tabs = settings.tabs;
        }

        function setVmMasks(vm) {
            vm.dateMask = settings.masks.date;
            vm.ageMask = settings.masks.age;
            vm.phoneMask = settings.masks.phone;
            vm.postalCodeMask = settings.masks.postalCode;
            vm.costCurrencyMask = settings.masks.costCurrency;
        }

        // TODO-Mike: remove this code when all dates are converted to the new models.
        /**
         * @description
         * DO NOT USE THIS GOING FORWARD, UNLESS NEEDED FOR OLD, NON-DEPARTURE OR RETURN DATES...
         * THIS IS DEPRECATED AS WE MOVE TOWARD USING THE NEW DATE MODELS.
         * get display string for a local datetime stamp (just the date is returned in a string for display)
         */
        function getLocalDateDisplayString(date) {
            return moment.parseZone(date).format("MM/DD/YYYY");
        }

        /*
         * @description
         * Given a ratingId this method determines if it is an Aircare rating Id based on the web config
         */
        function isAircare(packageRatingId) {
            
            var isAircare = false;
            var aircareRatingIds = trim($rootScope.config.CLIENT_AIRCARE_RATING_IDS).split(';');

            for (var i in aircareRatingIds) {
                var ratingId = aircareRatingIds[i];

                if (ratingId !== undefined && ratingId !== null && trim(ratingId).length !== 0) {
                    if (ratingId == packageRatingId) {
                        isAircare = true;
                        break;
                    }
                }
            }

            return isAircare;
        }

        /*
         * @description
         * This method is a browser safe implementation for a trim functionality
         */
        function trim(str) {
            return str.replace(/^\s+|\s+$/gm, '');
        }

        /*
         * @description
         * This returns all traditional ratings ids from the web configs as an array.
         */
        function getTraditionalRatingIds() {
            return portalService.loadConfig().then(function (config) {
                var traditionalRatingIds = trim(config.CLIENT_TRADITIONAL_RATING_IDS).split(';');
                return traditionalRatingIds;
            });
        }

        /*
         * @description
         * This returns all aircare ratings ids from the web configs as an array.
         */
        function getAircareRatingIds() {
            return portalService.loadConfig().then(function (config) {
                var aircareRatingIds = trim(config.CLIENT_AIRCARE_RATING_IDS).split(';');
                return aircareRatingIds;
            });
        }


        /*
         * @description
         * This returns an object with firstName, lastName and isFullName. It splits a complete name based on the first space.
         */
        function splitFullNameOnCard(fullName) {
            var formattedName = {
                firstName: null,
                lastName: null,
                isFullName: false
            };

            fullName = fullName.trim();
            var firstSpace = fullName.search(" ");
            if (firstSpace > -1) {
                formattedName.firstName = (fullName.substring(0, firstSpace)).trim();
                formattedName.lastName = (fullName.substring(firstSpace + 1, fullName.length)).trim();
                formattedName.isFullName = true;
            }

            return formattedName;
        }

        // finds the API error message that matches the specified code
        function getMessageWithCode(code, messages) {
            var message = null;

            for (var i = 0; i < messages.length; i++) {
                var currentMessage = messages[i];

                if (currentMessage.code === code) {
                    message = currentMessage;
                    break;
                }
            }

            return message;
        }

        function isOddIndexNumber(n) {
            // add one to the index value to determine if it is odd.
            // E.g., first index in an array = 0, but it should be odd (treat as '1').
            return isOddNumber(n + 1);
        }

        function isOddNumber(n) {
            if(n === 0){
                return false;
            }

            return (n % 2 !== 0);
        }
    }
})();