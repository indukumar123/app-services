(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name format
     *
     * # formatService
     *
     * @description
     * a set of functions used for formatting tasks
     */
    angular.module('agentPortal')
        .service( 'format', [function () {
            var isoDateFormat = 'YYYY-MM-DD';
            var displayDateFormat = 'MM/DD/YYYY';

            return {
                formatDisplayMessage: formatDisplayMessage,
                formatCoverageLimits: formatCoverageLimits,
                commaSeparateNumber: commaSeparateNumber,
                getDisplayDateFromIsoDateTimeString: getDisplayDateFromIsoDateTimeString,
                getLocalDateDisplayString: getLocalDateDisplayString,
                getLocalDateFromUTC: getLocalDateFromUTC,
                getDisplayDateStringFromIsoString: getDisplayDateStringFromIsoString,
                getIsoDateStringFromDisplayDateString: getIsoDateStringFromDisplayDateString,
                getDisplayDateStringFromMoment: getDisplayDateStringFromMoment,
                getMomentFromIsoDateString: getMomentFromIsoDateString,
                getIsoDateStringFromMoment: getIsoDateStringFromMoment,
                getDateFromIsoDateString: getDateFromIsoDateString,
                getIsoDateStringFromIsoDateTimeString: getIsoDateStringFromIsoDateTimeString,
                getIsoDateStringFromDate: getIsoDateStringFromDate
            };

            function formatDisplayMessage(message) {
                // replace any newline chars here with br tags.
                return message ? message.replace(/\\n/gi, '<br />') : '';
            }

            function formatCoverageLimits(coverage, tripCost) {
                var returnValue = null;

                if (coverage != null) {
                    if (coverage.percentageLimitofTripCost != null) {
                        if (tripCost) {
                            returnValue = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(tripCost);
                        }
                        else {
                            returnValue = coverage.percentageLimitofTripCost + "% of trip cost"
                        }
                    }
                    else {
                        if (coverage.coverageLimit != null) {
                            returnValue = "$" + commaSeparateNumber(coverage.coverageLimit);
                        }
                        if (coverage.dailyLimit != null) {
                            returnValue += " ($" + commaSeparateNumber(coverage.dailyLimit) + "/day)";
                        }
                        if (coverage.deductible != null) {
                            returnValue += " ($" + commaSeparateNumber(coverage.deductible) + " deductible)";
                        }
                    }

                    if (coverage.subLimits) {
                        for (var i in coverage.subLimits) {
                            returnValue += " ($" + commaSeparateNumber(coverage.subLimits[i].value) + " " + coverage.subLimits[i].name.toLowerCase() + ")";
                        }
                    }
                }

                return returnValue;
            }

            function commaSeparateNumber(inputNumber) {
                inputNumber = inputNumber + "";
                
                var decimalPart = "";
                if (inputNumber.split('.').length > 1)
                {
                    inputNumber = parseFloat(inputNumber, 10).toFixed(2);
                    decimalPart = inputNumber.split('.')[1];
                    inputNumber = inputNumber.split('.')[0];
                }
                var numberArray = inputNumber.split('');
                var index = -3;

                while (numberArray.length + index > 0) {
                    numberArray.splice(index, 0, ',');

                    // Decrement by 4 since we just added another unit to the array.
                    index -= 4;
                }

                return numberArray.join('') + (decimalPart != "" ? "." : "") + decimalPart;
            }

            // TODO-Mike: get rid of this method
            function getLocalDateDisplayString(localDate, format) {
                var output = localDate.substring(0, 10);

                var momentDate = moment(output, "YYYY-MM-DD");

                output = momentDate.format(format);

                return output;
            }

            // formats an iso string into a normal display date string.
            function getDisplayDateStringFromIsoString( isoDateString ) {
                // use start of day to lop off any time that gets assumed by moment.
                return moment( getIsoDateStringFromIsoDateTimeString(isoDateString), isoDateFormat, true ).startOf( 'day' ).format( displayDateFormat );
            }

            function getDisplayDateStringFromMoment( momentDateObj ) {
                // use start of day to lop off any time that gets assumed by moment.
                return momentDateObj.startOf( 'day' ).format( displayDateFormat );
            }

            function getIsoDateStringFromDisplayDateString( displayDateString ) {
                // use start of day to lop off any time that gets assumed by moment.
                return moment( displayDateString, displayDateFormat, true ).startOf( 'day' ).format( isoDateFormat );
            }

            function getIsoDateStringFromDate( date ) {
                // use start of day to lop off any time that gets assumed by moment.
                return moment( date ).startOf( 'day' ).format( isoDateFormat );
            }

            function getMomentFromIsoDateString( isoDateString ) {
                return moment( isoDateString, isoDateFormat, true );
            }

            function getIsoDateStringFromMoment( momentDateObj ) {
                // use start of day to lop off any time that gets assumed by moment.
                return momentDateObj.startOf( 'day' ).format( isoDateFormat );
            }

            // Use this when dealing with flight dates.
            //  lops off any time that comes with the date string. 
            //  allows a date with or without a time; good for lopping off utc info
            //    (timezone offsets, etc) for airport local time info.
            // E.g., takes in: 2016-10-20T21:15:00
            //  returns: 10/20/2016
            //  Note that the date/time above was being 
            function getDisplayDateFromIsoDateTimeString( isoDateString ) {
                return moment( getIsoDateStringFromIsoDateTimeString( isoDateString ), isoDateFormat ).format( displayDateFormat );
            }

            // datepickers expect a date object. they are interpreting the dates incorrectly 
            //  when strings are passed in. Use this method to create a date froma string for the datepicker
            function getDateFromIsoDateString( isoDateString ) {
                // take only the date part of the string. we don't want the javascript
                //  date object or moment to account for time adjustments between time zones.
                return moment( getIsoDateStringFromIsoDateTimeString( isoDateString ), isoDateFormat ).toDate();
            }

            // get just the date portion of the date/time string.
            function getIsoDateStringFromIsoDateTimeString( isoDateString ) {
                return isoDateString && isoDateString.length >= 10 ? isoDateString.substring( 0, 10 ) : isoDateString;
            }

            // TODO-Mike: do we need this anymore?
            function getLocalDateFromUTC(utcDate, format) {
                if (utcDate) {
                    var localDateTime = moment.utc(utcDate).toDate();
                    localDateTime = moment(localDateTime).format(format);
                    return localDateTime;
                }
            }

        }]);
})();
