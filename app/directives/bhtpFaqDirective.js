(function () {
    'use strict';

    angular.module('agentPortal')
        .directive('bhtpFaqDirective', bhtpFaqDirective);

    bhtpFaqDirective.$inject = ['$parse', '$stateParams'];
    function bhtpFaqDirective($parse, $stateParams) {
        return {
            restrict: 'EA',
            scope: {
                faqConfig: '=',
                showAgentFaq: '@',
                showWebFaq: '@',
                displayOn: '@'
            },
            templateUrl: 'app/layout/bhtpFaq.html',
            controller: bhtpFaqDirectiveCtrl,
            controllerAs: 'vm',
            bindToController: true,
            link: function (scope, element, attrs) {
                scope.$watch(function () { return attrs.packages; }, function (packages) {
                    if (packages) {
                        var parsedPackages = $parse(packages)(scope);
                        var packageRatingIds = [];
                        for (var i = 0; i < parsedPackages.length; i++) {

                            // If there is a packageId in the url, only show FAQs for that package
                            if ($stateParams.packageId) {
                                if ($stateParams.packageId === parsedPackages[i].id) {
                                    packageRatingIds.push(parsedPackages[i].ratingId);
                                }
                            } else {
                                // If there is a packageId in the attributes, only show FAQs for that package
                                if (attrs.packageId) {
                                    if (attrs.packageId === parsedPackages[i].id) {
                                        packageRatingIds.push(parsedPackages[i].ratingId);
                                    }
                                }
                            }

                            // If there is nothing indicating a specific package, get it for everyone.
                            if (!attrs.packageId && !$stateParams.packageId) {
                                packageRatingIds.push(parsedPackages[i].ratingId);
                            }
                        }
                        if (packageRatingIds.length > 0) {
                            scope.vm.getFaqsByPackageRatingIds(packageRatingIds);
                        }
                    }
                }, true);

                if (scope.vm.displayOn === "true") {
                    scope.vm.hasFaqs = true;
                    scope.vm.switch();
                }
            }
        };
    }

    bhtpFaqDirectiveCtrl.$inject = ['faqService'];
    function bhtpFaqDirectiveCtrl(faqService) {
        var vm = this;
        vm.groups = [];
        vm.title = '';
        vm.mainHeader = '';

        /**
         * @description
         * initialization, loads FAQs information from the server
         */
        function init() {
            vm.title = "FAQ & Help";
            vm.mainHeader = 'No matter how we try to make things simple, there are always going to be questions. ' +
            'That\'s the nature of insurance. We understand that, and we\'ve tried to anticipate some ' +
            'of your most frequent questions. If you have any other questions that aren\'t on this list, email sales@bhtp.com or call 844-411-BHTP. Thanks!';

            initGroups();
        }

        function initGroups() {
            if (vm.showWebFaq.toLowerCase() === "true") {
                getGenralFaqsForConsumers();
            }

            if (vm.showAgentFaq.toLowerCase() === "true") {
                getGenralFaqsForAgents();
            }
        }

        function expandGroupIfOnlyOneGroupAndDisplayOn() {
            if (vm.displayOn === "true") {
                if (vm.groups.length === 1) {
                    vm.toggleGroupSelection(vm.groups[0]);
                }
            }
        }

        function getGenralFaqsForAgents() {
            var generalFaqs = [];
            faqService.getGenralFaqsForAgents().then(function (result) {
                for (var i = 0; i < result.data.length; i++) {
                    generalFaqs.push({
                        id: 'faq' + i,
                        title: result.data[i].title,
                        content: result.data[i].content,
                        isSelected: false
                    });
                }
                vm.groups.push({ id: "agent", name: "Agency", details: generalFaqs, isSelected: false });

                // Auto expand group if it is the only one.
                if (vm.showWebFaq.toLowerCase() !== "true") {
                    expandGroupIfOnlyOneGroupAndDisplayOn();
                }
            });
        }

        function getGenralFaqsForConsumers() {
            var generalFaqs = [];
            faqService.getGenralFaqsForConsumers().then(function (result) {
                for (var i = 0; i < result.data.length; i++) {
                    generalFaqs.push({
                        id: 'faq' + i,
                        title: result.data[i].title,
                        content: result.data[i].content,
                        isSelected: false
                    });
                }
                vm.groups.push({ id: "consumer", name: "Consumers", details: generalFaqs, isSelected: false });

                // Auto expand group if it is the only one.
                if (vm.showAgentFaq.toLowerCase() !== "true") {
                    expandGroupIfOnlyOneGroupAndDisplayOn();
                }
            });
        }

        function verifyPackageisNotInGroup(ratingId) {
            var notInGroup = true;
            if (vm.groups) {
                for (var i = 0; i < vm.groups.length; i++) {
                    if (vm.groups[i].id === ratingId) {
                        notInGroup = false;
                        break;
                    }
                }
            }
            return notInGroup;
        }

        function sortByOrder(a, b) {
            if (a.order < b.order) {
                return 1;
            }
            if (a.order > b.order) {
                return -1;
            }
            return 0;
        }

        function mapFaqsForDisplay(packageRatingIds, faqArray) {
            var mappedArray = [];

            // Map Faqs to unique ratingIds
            for (var m = 0; m < packageRatingIds.length; m++) {
                var packageFaqs = [];
                for (var f = 0; f < faqArray.length; f++) {

                    // If the rating id in mapped array equals the rating Id in the faq array we will need to add that faq to that package
                    if (packageRatingIds[m] === faqArray[f].ratingId) {
                        packageFaqs.push({
                            id: 'faq' + f,
                            title: faqArray[f].title,
                            content: faqArray[f].content,
                            isSelected: false,
                            order: faqArray.order,
                            packageName: faqArray[f].packageName,
                            packageSubtitle: faqArray[f].packageSubtitle
                        });
                    }
                }
                if (packageFaqs && packageFaqs.length > 0) {
                    packageFaqs.sort(sortByOrder);
                    mappedArray.push({
                        id: 'package' + packageFaqs[0].packageName,
                        name: packageFaqs[0].packageName + (packageFaqs[0].packageSubtitle ? " " + packageFaqs[0].packageSubtitle : ""),
                        faqs: packageFaqs
                    });
                }
            }

            return mappedArray;
        }

        function isInArray(value, array) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].ratingId === value) {
                    return true;
                }
            }
            return false;
        }

        vm.getFaqsByPackageRatingIds = function getFaqsByPackageRatingIds(packageRatingIds) {
            faqService.getFaqsByPackageRatingIds(packageRatingIds).then(function (result) {
                if (result.data.length > 0) {
                    vm.hasFaqs = true;
                    var faqsForDisplay = mapFaqsForDisplay(packageRatingIds, result.data);

                    // Saving the consumer and agency faqs
                    // Setting the vm.groups empty to ensure that duplicates don't show up when getting quick quote
                    // repopulate the consumer and agnecy faqs
                    var nonProductFaqs = [];
                    if (vm.groups.length > 0) {
                        for (var n = 0; n < vm.groups.length; n++) {
                            if (vm.groups[n].id === "agent" || vm.groups[n].id === "consumer") {
                                nonProductFaqs.push(vm.groups[n]);
                            }
                        }
                    }

                    vm.groups = [];
                    for (var faq in nonProductFaqs) {
                        vm.groups.push(nonProductFaqs[faq]);
                    };

                    for (var i = 0; i < faqsForDisplay.length; i++) {
                        vm.groups.push({ id: faqsForDisplay[i].id, name: faqsForDisplay[i].name, details: faqsForDisplay[i].faqs, isSelected: false });
                    }
                } else {
                    // Don't show the faqs if there isn't any.
                    vm.hasFaqs = false;
                }
            });
        }

        vm.switch = function switchFunc() {
            vm.expanded = !vm.expanded
        }

        vm.toggleGroupSelection = function toggleGroupSelection(group) {
            //toggle current group;
            group.isSelected = !group.isSelected;

            //reset all others;
            for (var i = 0; i < vm.groups.length; i++) {
                if (group.id != vm.groups[i].id) {
                    vm.groups[i].isSelected = false;
                }
            }
        }
        vm.toggleSelection = function toggleSelection(groups, row) {
            //toggle current row;
            row.isSelected = !row.isSelected;
        };

        init();
    }
})();