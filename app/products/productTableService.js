/* jshint -W074 */
(function () {
    'use strict';

    angular
        .module('agentPortal')
        .factory('productTableService', productTableService);

    productTableService.$inject = ['format'];

    function productTableService(format) {

        var service = {
            refinePackageData: refinePackageData,
            groupCoverages: groupCoverages
        };
        return service;

        function refinePackageData(pkg, allCoverages, groupByName) {
            var coverageMap = {};

            if (pkg && pkg.coverages) {
                for (var j = 0; j < pkg.coverages.length; j++) {
                    var coverage = pkg.coverages[j];

                    // ignore 'Extra Upgrade' coverages
                    if (coverage.type === 'Extra Upgrade') {
                        continue;
                    }
                   
                    switch (coverage.coverageGroup) {
                        case "Trip":
                        case "Accidental Death/Dismemberment":
                        case "Baggage":
                        case "Missed Connection":
                        case "Car Rental":
                            coverage.coverageGroup = "Trip-Related Coverages";
                            break;
                        case "Medical":
                            coverage.coverageGroup = "Medical & Emergency Coverage";
                            break;
                        default:
                            coverage.coverageGroup = "Other Coverages";
                            break;
                    }

                    if (!searchForCoverageInList(coverage, allCoverages, groupByName)) {
                        // Add current coverage to all coverages array
                        allCoverages.push({
                            name: coverage.name,
                            displayGroup: coverage.coverageGroup,
                            category: coverage.category
                        });
                    }

                    // Add current coverage to current package's coverage map
                    var coverageKey = groupByName ? coverage.name : coverage.category;

                    var currentCoverage = coverageMap[coverageKey];
                    var hasStandardData = currentCoverage && (currentCoverage.type === 'Standard' || currentCoverage.type === 'Extra');
                    var isUpgradeCoverage = coverage.type === 'Upgrade';

                    // Set to null first so upgrade limit doesn't get set to a regular coverage limit
                    var upgradeLimitToSet = null;

                    // Work from current coverage and move upgrade limit up for new coverage
                    if (currentCoverage) {
                        upgradeLimitToSet = currentCoverage.upgradeLimit;
                    }

                    // If the coverage is an upgrade coverage set it to that since only one upgrade per coverage
                    if (isUpgradeCoverage === true) {
                        upgradeLimitToSet = getMaxCoverageLimit(coverage.limits, false);
                    }

                    // Add coverage to coverage map, keep original coverage data if it already contains standard coverage information
                    // This likely could be done a little cleaner, but it will work for now
                    coverageMap[coverageKey] = {
                        name: coverage.name,
                        shortName: coverage.shortName,
                        description: coverage.description,
                        limit: hasStandardData ? currentCoverage.limit : coverage.coverageLimitDisplayText,
                        type: hasStandardData ? currentCoverage.type : coverage.type,
                        selected: coverage.selected,
                        hasUpgrade: (currentCoverage && currentCoverage.hasUpgrade === true ? true : isUpgradeCoverage),
                        upgradeLimit: upgradeLimitToSet
                    };
                }

                mapErrorsToFields(pkg);
            }

            return {
                coverages: coverageMap,
                package: pkg,
                allCoverages: allCoverages
            };
        }

        function searchForCoverageInList(coverage, allCoverages, groupByName) {
            for (var k = 0; k < allCoverages.length; k++) {
                if (allCoverages[k].displayGroup === coverage.coverageGroup &&
                    ((!groupByName && allCoverages[k].category === coverage.category) ||
                    (groupByName && allCoverages[k].name === coverage.name))) {

                    return true;
                }
            }

            return false;
        }

        function groupCoverages(allCoverages, groupByName) {
            var coverageGroups = {};
            for (var key in allCoverages) {
                if (allCoverages.hasOwnProperty(key)) {
                    var coverage = allCoverages[key];

                    if (!coverageGroups[coverage.displayGroup]) {
                        coverageGroups[coverage.displayGroup] = {
                            displayGroupOrder: coverage.displayGroupOrder,
                            coverages: []
                        };
                    }

                    if (groupByName) {
                        coverageGroups[coverage.displayGroup].coverages.push(coverage.name);
                    }
                    else {
                        coverageGroups[coverage.displayGroup].coverages.push(coverage.category);
                    }
                }
            }

            angular.forEach(coverageGroups, function (value) {
                value.coverages.sort(function (a, b) {
                    if (a !== b) {
                        if (a > b) { return 1; }
                        if (a < b) { return -1; }
                    }
                    return a - b;
                });
            });

            return coverageGroups;
        }

        function mapErrorsToFields(pkg) {
            if (pkg.messages && pkg.messages.length > 0) {
                var fields = [];
                for (var i = 0; i < pkg.messages.length; i++) {
                    var message = pkg.messages[i];
                    switch (message.code) {
                        case '2713':
                        case '2205':
                            fields.push('Total Trip Cost');
                            break;
                        case '2233':
                            fields.push('Initial Trip Deposit Date');
                            break;
                        case '2229':
                            fields.push('Destination Country');
                            break;
                        case '2230':
                        case '2715':
                            fields.push('Departure Date');
                            break;
                        case '2231':
                        case '2717':
                            fields.push('Return Date');
                            break;
                    }
                }

                fields.sort();
                pkg.errorFields = '<ul class="text-left list-unstyled">';
                for (var f = 0; f < fields.length; f++) {
                    pkg.errorFields += '<li>' + fields[f] + '</li>';
                }

                pkg.errorFields += '</ul>';
            }
        }

        function getMaxCoverageLimit(coverageLimits, sendFormatted) {
            if (coverageLimits.length > 0) {
                return Math.max.apply(Math, coverageLimits);
            }
        }

        function formatNumberForCurrencyDisplay(number) {
            return "$" + format.commaSeparateNumber(number);
        }
    }

})();
