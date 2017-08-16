(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('tableHelper', [tableHelper]);

    function tableHelper() {

        return {
            rowIsPopulated: rowIsPopulated,
            getFieldHash: getFieldHash,
            stringInList: stringInList,
            getRowHash: getRowHash,
            hasFieldErrors: hasFieldErrors
        };

        function rowIsPopulated(row) {
            var hasPopulatedField = false;

            for (var property in row.data) {
                if (row.data.hasOwnProperty(property)) {
                    if (row.data[property]) {
                        hasPopulatedField = true;
                        break;
                    }
                }
            }

            return hasPopulatedField;
        }

        // Based on http://stackoverflow.com/a/7616484/3760830
        function getFieldHash(fieldValue) {
            var hash = 0, i, chr, len;

            if (typeof fieldValue === "number") {
                fieldValue = fieldValue.toString();
            }

            if (fieldValue.length === 0) return hash;

            for (i = 0, len = fieldValue.length; i < len; i++) {
                chr = fieldValue.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }

            return hash;
        }

        function stringInList(string, list) {
            var stringInList = false;

            for (var i = 0; i < list.length; i++) {
                var listItem = list[i];

                if (listItem === string) {
                    stringInList = true;
                    break;
                }
            }

            return stringInList;
        }

        function getRowHash(row) {
            var rowHash = "";

            for (var property in row.hash) {
                if (row.data.hasOwnProperty(property)) {
                    rowHash += row.hash[property] + "_";
                }
            }

            return rowHash;
        }

        function hasFieldErrors(row) {
            if (row.fieldErrors) {
                for (var property in row.fieldErrors) {
                    if (row.fieldErrors.hasOwnProperty(property)) {
                        return true;
                    }
                }
            }

            return false;
        }
    }
})();