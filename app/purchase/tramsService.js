(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('tramsService', tramsService);

    function tramsService() {
        var vm = this;
        vm.xmlDoc;
        vm.node;
        vm.elements;

        return {
            getTramsXml: generateXml
        };

        // Generate XML for Trams
        function generateXml(policy, travlers, pkg) {
            vm.xmlDoc = document.implementation.createDocument(null, 'RESCARD', null);

            setNode('DATEFORMAT', 'RESCARD', 'MMDDYYYY');
            setNode('RESERVATION', 'RESCARD');
            setNode('VENDORCODE', 'RESERVATION', 'BHTP');
            setNode('VENDORNAME', 'RESERVATION', 'Berkshire Hathaway Travel Protection');
            setNode('RESTYPE', 'RESERVATION', '4');
            setNode('RESDATE', 'RESERVATION', new moment(policy.purchaseDate).format('MMDDYYYY'));
            setNode('CONFIRMATIONNUMBER', 'RESERVATION', policy.policyNumber);
            setNode('SOURCEOFBOOKING', 'RESERVATION', 'Live Connect');
            setNode('BOOKINGSTATUS', 'RESERVATION', 'CONFIRMED');
            setNode('STATUS', 'RESERVATION', 'Paid in Full');
            setNode('NOOFUNITS', 'RESERVATION', '1');
            setNode('NOOFPAX', 'RESERVATION', '1');
            setNode('CURRENCYCODE', 'RESERVATION', 'USD');
            setNode('TOTALBASE', 'RESERVATION', policy.premium);
            if ( policy.taxes ) {
                setNode( 'TOTALTAX', 'RESERVATION', policy.taxes.toString() );
            }
            setNode('STARTDATE', 'RESERVATION', new moment(policy.localDepartureDate).format('MMDDYYYY'));
            setNode('ENDDATE', 'RESERVATION', new moment(policy.localReturnDate).format('MMDDYYYY'));
            setNode('PASSENGERLIST', 'RESERVATION');

            for (var idx = 0; idx < travlers.length; idx++) {
                setNode('PASSENGER', 'PASSENGERLIST');
                setNode('LASTNAME', 'PASSENGER', travlers[idx].lastName, idx);
                setNode('FIRSTNAME', 'PASSENGER', travlers[idx].firstName, idx);
                setNode('PASSENGERTYPE', 'PASSENGER', 'A', idx);
            }

            setNode('SERVICEPROVIDERLIST', 'RESERVATION');
            setNode('SERVICEPROVIDER', 'SERVICEPROVIDERLIST');
            setNode('PROVIDERTYPE', 'SERVICEPROVIDER', '4');
            setNode('SERVICEPROVIDERNAME', 'SERVICEPROVIDER', 'Berkshire Hathaway Travel Protection');
            setNode('STARTDATE', 'SERVICEPROVIDER', new moment(policy.localDepartureDate).format('MMDDYYYY'));
            setNode('ENDDATE', 'SERVICEPROVIDER', new moment(policy.localReturnDate).format('MMDDYYYY'));
            setNode('DESCRIPTION', 'SERVICEPROVIDER', 'Full Coverage Insurance');

            // setNode('DEDUCTIBLES', 'SERVICEPROVIDER', 'Varies By Coverage');
            // setNode('MAXCOVERAGE', 'SERVICEPROVIDER', 'Varies By Coverage');
            setNode('ITINREMARKS', 'SERVICEPROVIDER', generatePolicyDescription(policy, travlers));

            var serializer = new XMLSerializer();
            var xmlString = serializer.serializeToString(vm.xmlDoc);

            return xmlString;
        }

        function generatePolicyDescription(policy, travlers) {
            var policyFields = [
                'policyNumber',
                'packageName',
                'expirationDate',
                'localExpirationDate',
                'expirationTimezone',
                'effectiveDate',
                'localEffectiveDate',
                'effectiveTimezone',
                'tripDepositDate',
                'localDepartureDate',
                'departureDate',
                'localReturnDate',
                'returnDate',
                'destinationCity',
                'destinationState',
                'destinationCountry',
                'destinationCity',
                'destinationState',
            ]

            var coverageFields = [
                'name',
                'coverageLimitDisplayText',
                'coverageLimitFormattedFor',
                'deductible'
            ]

            var output = '';

            try
            {
                for (var i = 0; i <= policyFields.length -1; i++) {
                    output = output.concat(policyFields[i].toUpperCase() + ':' + policy[policyFields[i]]);
                    output = output.concat('|');
                }


                for (var i = 0; i <= travlers[0].coverages.length - 1; i++) {
                    output = output.concat(travlers[0].coverages[i].name.replace('&', 'and') + ' ' + travlers[0].coverages[i].coverageLimitDisplayText + ' ' + travlers[0].coverages[i].coverageLimitFormattedFor + '|');
                }
            }
            catch (error)
            {
                output = "There was an issue gathering the reservation details."
            }

            output = output.concat('If you have any questions regarding this policy, please call BHTP at 844-411-BHTP or email us at assist@bhtp.com');

            return output;
        }

        // Set Nodes
        function setNode(node, parentNode, data, idx) {
            // Set up vars
            var element;
            var elementValue;

            // Create the element
            element = vm.xmlDoc.createElement(node);

            // If the element needs data
            if (data) {
                // Create the element data
                elementValue = vm.xmlDoc.createTextNode(data);
                // Attach value to the element
                element.appendChild(elementValue);
            }

            // Get the current elements in the document
            vm.elements = vm.xmlDoc.getElementsByTagName(parentNode);

            if (idx) {
                vm.elements[idx].appendChild(element);
            }
            else {
                vm.elements[0].appendChild(element);
            }
        }
    }
})();