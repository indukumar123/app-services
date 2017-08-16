(function() {
    'use strict';

    angular.module('agentPortal')
        .factory('exactCareDataMapper', ['$rootScope', 'settings', 'utilService', 'format', exactCareDataMapper]);

    /**
    * @ngdoc controller
    * @name exactCareDataMapper
    *
    * # exactCareDataMapper
    *
    * @description
    * mapper to map complete care realted entities from one format to another
    */
    function exactCareDataMapper($rootScope, settings, utilService, format) {
        /**
         * @description
         * public functions exposed by this mapper
         */
        return {
            mapFromCustomer: mapFromCustomer,
            mapFromQuote: mapFromQuote,
            mapToPriceQuote: mapToPriceQuote,
            mapFromCoverageTrip: mapFromCoverageTrip,
            mapFromCoverageMedical: mapFromCoverageMedical,
            mapFromStatesForPackage: mapFromStatesForPackage,
            mapToSaveQuoteRequest: mapToSaveQuoteRequest,
            mapCoveragesFromQuote: mapCoveragesFromQuote,
            validTravelers: validTravelers
        };

        /**
         * @description
         * map from server customer object to entity understood by the client side
         */
        function mapFromCustomer(policyState) {
            policyState.policy.primary.firstName = policyState.customer.firstName;
            policyState.policy.primary.lastName = policyState.customer.lastName;
            policyState.policy.primary.birthDate = moment(policyState.customer.birthDate).format('MM/DD/YYYY');
            policyState.policy.primary.age = moment().diff(moment(policyState.customer.birthDate), 'years');
            policyState.policy.primary.emailAddress = policyState.customer.emailAddress;
            policyState.policy.primary.address = policyState.customer.address;
            policyState.policy.primary.customerId = policyState.customer.customerId;

            if (policyState.customer.phoneNumbers && policyState.customer.phoneNumbers.length > 0) {
                policyState.policy.primary.phoneNumber = policyState.customer.phoneNumbers[0].phoneNumber;
            }

            if (!policyState.policy.primary.emailAddress) {
                policyState.policy.primary.noEmailAddress = true;
            }

            policyState.policy.primaryTraveler = policyState.customer.customerId;
        }

        /**
         * @description
         * map from server quote object to entity understood by the client side
         */
        function mapFromQuote(quoteData, policyState) {
            //Get Quote
            var quote = quoteData.quote.policy;

            //Trip Cost Options
            var totalTripCostProvided = quote.totalTripCostProvided;

            //This should never be null... But for policies/quotes pre trip cost logic all tripcosts were provided as total
            if (totalTripCostProvided == null) {
                totalTripCostProvided = true;
            }

            policyState.policy.tripCostOption = totalTripCostProvided ? "true" : "false";
            policyState.policy.tripCost = quote.tripCost;

            policyState.quote = quoteData.quote;
            policyState.customer = quoteData.customer;

            policyState.policy.fulfillmentMethod = quoteData.fulfillmentMethod;

            policyState.policy.destination.country = quoteData.destination.country;
            policyState.policy.travel.airline = quoteData.travel.airline;
            policyState.policy.travel.airlineNotProvided = !quoteData.travel.airline || !quoteData.travel.airline.id;
            policyState.policy.travel.tourOperator = quoteData.travel.tourOperator;
            policyState.policy.travel.cruiseLine = quoteData.travel.cruiseLine;
            policyState.policy.travel.hotel = quoteData.travel.hotel;
            policyState.policy.travel.rentalCompany = quoteData.travel.rentalCompany;

            //Special Car Rental Company Logic,  on loading of a save quote if the rental company properties are null we need to make sure that the entire object is null
            if (quoteData.travel.carRentalCompany.id != null && quoteData.travel.carRentalCompany.name != null) {
                policyState.policy.travel.carRentalCompany = quoteData.travel.carRentalCompany;
            }
            else
            {
                policyState.policy.travel.carRentalCompany = null;
            }

            policyState.policy.travel.carPickupDate = quote.rentalCarPickupDate ? moment(quote.rentalCarPickupDate).format('MM/DD/YYYY') : quote.rentalCarPickupDate;
            policyState.policy.travel.carReturnDate = quote.rentalCarReturnDate ? moment(quote.rentalCarReturnDate).format('MM/DD/YYYY') : quote.rentalCarReturnDate;

            if (policyState.customer) {
                policyState.policy.primary.emailAddress = policyState.customer.emailAddress;
                if (!policyState.policy.primary.emailAddress) {
                    policyState.policy.primary.noEmailAddress = true;
                }

                if (policyState.customer.phoneNumbers && policyState.customer.phoneNumbers.length > 0)
                    policyState.policy.primary.phoneNumber = policyState.customer.phoneNumbers[0].phoneNumber;
            }

            policyState.policy.primary.address = {};
            policyState.coverages = { total: 0, doc: { state: '', url: '' } };

            var primaryTraveler = policyState.quote.travelers.filter(function(traveler) {
                return traveler.isPrimary;
            })[0];

            var additionalTravelers = policyState.quote.travelers.filter(function(traveler) {
                return !traveler.isPrimary;
            });

            if (totalTripCostProvided) {
                //Set place holder value to Total Trip Cost 
                policyState.policy.UICostHolder = quote.tripCost;
            }
            else if (!totalTripCostProvided) {
                //Set place holder to primary travelers age.
                policyState.policy.UICostHolder = primaryTraveler.tripCost;
            }

            mapCoveragesFromQuote(primaryTraveler, policyState);

            policyState.policy.primary.firstName = primaryTraveler.firstName;
            policyState.policy.primary.lastName = primaryTraveler.lastName;
            policyState.policy.primary.age = primaryTraveler.age;
            policyState.policy.primary.birthDate = moment(primaryTraveler.birthDate).format('MM/DD/YYYY');
            policyState.policy.primary.gender = primaryTraveler.gender;
            policyState.policy.primary.tripCost = primaryTraveler.tripCost;

            policyState.policy.travelers = additionalTravelers;
            policyState.policy.departureDate = format.getDisplayDateStringFromIsoString( quote.departureDates.localized.dateString );
            policyState.policy.returnDate = format.getDisplayDateStringFromIsoString( quote.returnDates.localized.dateString );

            policyState.policy.depositDate = quote.tripDepositDate != null ? utilService.getLocalDateDisplayString(quote.tripDepositDate) : null;

            policyState.policy.primary.address.address1 = quote.policyAddress.address1;
            policyState.policy.primary.address.address2 = quote.policyAddress.address2;
            policyState.policy.primary.address.city = quote.policyAddress.city;
            policyState.policy.primary.address.stateOrProvince = quote.policyAddress.stateOrProvince;
            policyState.policy.primary.address.postalCode = quote.policyAddress.postalCode;

            policyState.policy.destination.state = quote.destinationState;
            policyState.policy.destination.city = quote.destinationCity;

            policyState.policy.travel.airlineModel = quote.airline;
            policyState.policy.travel.carRentalCompanyModel = quote.carRentalCompany;
            policyState.policy.travel.cruiseLineModel = quote.cruiseLine;
            policyState.policy.travel.tourOperatorModel = quote.tourOperator;
            policyState.policy.travel.hotelModel = quote.hotel;
            policyState.policy.travel.rentalCompanyModel = quote.rentalCompany;
            policyState.policy.destination.countryModel = quoteData.destination.country.name;
        }

        /**
         * @description
         * map from server coverage object to entity understood by the client side
         */
        function mapCoveragesFromQuote(primaryTraveler, policyState) {
            var coverageTotal = 0;
            policyState.coverages.included = angular.copy(primaryTraveler.coverages.filter(function (coverage) {
                return coverage.type == "Standard" || coverage.type == "Extra";
            }));

            policyState.coverages.optional = angular.copy(primaryTraveler.coverages.filter(function (coverage) {
                var isOptional = coverage.type == "Optional" || coverage.type == "Upgrade" || coverage.type == "Extra Upgrade";
                if (isOptional) {
                    coverageTotal += coverage.premium;
                }
                return isOptional;
            }));

            policyState.coverages.total = coverageTotal;
        }

        /**
         * @description
         * map from convert quote response to save quote request entity
         * this is used to create request for save price.
         */
        function mapToSaveQuoteRequest(policyState) {
            var request = policyState.convertedPriceQuote;
            request.policy.isSavedQuote = true;
            request.policy.agentCode = policyState.policy.agentCode;
            request.fulfillmentMethod = policyState.policy.fulfillmentMethod;

            if (policyState.customer) {
                request.policy.primaryTraveler = policyState.customer.customerId;
            } else {
                request.policy.primaryTraveler = null;
            }

            return request;
        }

        /**
         * @description
         * gets the valid travelers.
         */
        function validTravelers(travelers) {
            return travelers.filter(function(traveler) {
                return traveler.age >= 0 && traveler.age !== "";
            });
        }

        /**
         * @description
         * map from client quote entity to object understood by server side
         * this is used to create request for get quote price.
         */
        //Map Internal Object to a Clarion Door Quote Request
        function mapToPriceQuote(policyState) {

            //Trip Cost Options
            var totalCostProvided = policyState.policy.tripCostOption === "true";
            var totalTripCost = 0;

            if (policyState.policy.primary.tripCost) {
                totalTripCost += policyState.policy.primary.tripCost;
            }

            if (policyState.policy.travelers && policyState.policy.travelers.length > 0) {
                for (var i = 0; i < policyState.policy.travelers.length; i++) {
                    if (policyState.policy.travelers[i].tripCost) {
                        totalTripCost += policyState.policy.travelers[i].tripCost;
                    }
                }
            }

            policyState.policy.UICostHolder = totalTripCost;

            var birthDate = moment(policyState.policy.primary.birthDate).format(settings.date.dataFormat);

            var priceQuote = {
                packageId: policyState.packageId,
                submissionChannel: "agents.bhtp.com",
                fulfillmentMethod: policyState.policy.fulfillmentMethod,
                //legacy support for departure and return dates.
                departureDate: format.getIsoDateStringFromDisplayDateString(policyState.policy.departureDate),
                returnDate: format.getIsoDateStringFromDisplayDateString( policyState.policy.returnDate ),

                // new fields for departure and return dates.
                departureDates: {
                    localized: {
                        fullDateTime: format.getIsoDateStringFromDisplayDateString( policyState.policy.departureDate )
                    }
                },
                returnDates: {
                    localized: {
                        fullDateTime: format.getIsoDateStringFromDisplayDateString(policyState.policy.returnDate)
                    }
                },

                destinationCountry: policyState.policy.destination.country.isoCode2,
                destinationState: policyState.policy.destination.state,
                destinationCity: policyState.policy.destination.city,
                residenceState: policyState.policy.primary.address.stateOrProvince,
                residenceCountry: 'US',
                tripCost: totalTripCost,
                totalTripCostProvided: totalCostProvided,
                initialDepositDate: format.getIsoDateStringFromDisplayDateString( policyState.policy.depositDate ),
                primaryTraveler: policyState.policy.primaryTraveler,
                travelers: [
                    {
                        firstName: policyState.policy.primary.firstName,
                        lastName: policyState.policy.primary.lastName,
                        age: policyState.policy.primary.age,
                        dateOfBirth: birthDate,
                        gender: policyState.policy.primary.gender,
                        tripCost: policyState.policy.primary.tripCost,
                        isPrimary: true,
                        pAccount: {
                            firstName: policyState.policy.primary.firstName,
                            lastName: policyState.policy.primary.lastName,
                            email: policyState.policy.primary.emailAddress,
                            dateOfBirth: birthDate,
                            gender: policyState.policy.primary.gender,
                            phoneNumber: policyState.policy.primary.phoneNumber,
                            address1: policyState.policy.primary.address.address1,
                            address2: policyState.policy.primary.address.address2,
                            city: policyState.policy.primary.address.city,
                            state: policyState.policy.primary.address.stateOrProvince,
                            zip: policyState.policy.primary.address.postalCode,
                            country: 'US'
                        }
                    }
                ],
                flights: null,
                quickQuote: true
            };

            if (policyState.policyBuyer && policyState.policyBuyer.firstName && policyState.policyBuyer.lastName) {
                var policyBuyer = policyState.policyBuyer;
                policyBuyer.pAccount = {
                    firstName: policyBuyer.firstName,
                    lastName: policyBuyer.lastName,
                    email: policyBuyer.emailAddress,
                    dateOfBirth: policyBuyer.dateOfBirth,
                    gender: policyBuyer.gender,
                    phoneNumber: policyBuyer.phoneNumber,
                    address1: policyBuyer.address.address1,
                    address2: policyBuyer.address.address2,
                    city: policyBuyer.address.city,
                    state: policyBuyer.address.state,
                    zip: policyBuyer.address.postalCode
                };

                priceQuote.policyBuyer = policyBuyer;
            }

            if (policyState.quote) {
                //priceQuote.previousVersionId = policyState.quote.policy.quoteId;
                priceQuote.quoteNumber = policyState.quote.policy.quoteNumber;
            }

            if (policyState.policy.travel.airline && policyState.policy.travel.airline.name != "")
                priceQuote.airline = policyState.policy.travel.airline;

            if (policyState.policy.travel.carRentalCompany && (policyState.policy.travel.carRentalCompany.name != "" && policyState.policy.travel.carRentalCompany.name  != null)) {
                priceQuote.carRentalCompany = policyState.policy.travel.carRentalCompany;
                priceQuote.carRentalCompany.pickupDate = policyState.policy.travel.carPickupDate !== null ? moment(policyState.policy.travel.carPickupDate).format("MM/DD/YYYY") : null;
                priceQuote.carRentalCompany.returnDate = policyState.policy.travel.carReturnDate !== null ? moment(policyState.policy.travel.carReturnDate).format("MM/DD/YYYY") : null;
            }
            if (policyState.policy.travel.cruiseLine && policyState.policy.travel.cruiseLine.name != "")
                priceQuote.cruiseLine = policyState.policy.travel.cruiseLine;
            if (policyState.policy.travel.tourOperator && policyState.policy.travel.tourOperator.name != "")
                priceQuote.tourOperator = policyState.policy.travel.tourOperator;
            if (policyState.policy.travel.hotel && policyState.policy.travel.hotel.name != "")
                priceQuote.hotel = policyState.policy.travel.hotel;
            if (policyState.policy.travel.rentalCompany && policyState.policy.travel.rentalCompany.name != "")
                priceQuote.rentalCompany = policyState.policy.travel.rentalCompany;

            if (policyState.coverages.allOptional && policyState.coverages.allOptional.length > 0) {
                policyState.coverages.optional = policyState.coverages.allOptional.filter(function(coverage) {
                    return coverage.selected;
                });
            }
            var coverages = policyState.coverages.optional ? policyState.coverages.included.concat(policyState.coverages.optional) : policyState.coverages.included;

            priceQuote.travelers[0].coverages = coverages;
            validTravelers(policyState.policy.travelers).forEach(function(traveler) {
                priceQuote.travelers.push({
                    age: traveler.age,
                    firstName: traveler.firstName,
                    lastName: traveler.lastName,
                    gender: traveler.gender,
                    email: traveler.email,
                    dateOfBirth: moment(traveler.birthDate).format(settings.date.dataFormat),
                    relationship: traveler.relationship,
                    tripCost: traveler.tripCost,
                    coverages: coverages
                });
            });
            return priceQuote;
        }

        /**
         * @description
         * map state information for a package.
         */
        function mapFromStatesForPackage(states, packageId) {
            var stateDetails = [];
            states.forEach(function(state) {
                var mappedState = {
                    id: state.id,
                    code: state.code,
                    name: state.name,
                    canSell: false
                };
                state.products.forEach(function(product) {
                    product.packages.forEach(function(packageElement) {
                        if (packageElement.id == packageId) {
                            mappedState.canSell = product.canSell;
                        }
                    });
                });

                stateDetails.push(mappedState);
            });
            return stateDetails;
        }

        /**
         * @description
         * map from server policy object coverages to entity understood by the client side for trip
         */
        function mapFromCoverageTrip(policyCoverages, purchaseDate, tripCost) {
            var TripCoverages = [];
            TripCoverages.push({
                "ratingId": "TC", name: "", coverage: "100% of Trip Cost",
                "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "TI", name: "", coverage: "150% of Trip Cost", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "TIRA", name: "", coverage: "$750", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "MC", name: "", coverage: "$500", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "TD", name: "", coverage: "$1,000 ($200/day)", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "BPE", name: "", coverage: "$1,000", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "BD", name: "", coverage: "$200", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "CRCC", name: "", coverage: "$35,000 per car", "Upgrades": []
            });
            TripCoverages.push({
                "ratingId": "CFAR", name: "", coverage: "50% of Trip Cost", "Upgrades": []
            });
            
            for (var i = 0; i < policyCoverages.included.length; i++) {
                var coverage = policyCoverages.included[i];
                for (var j = 0; j < TripCoverages.length; j++) {
                    if (coverage.ratingId == TripCoverages[j].ratingId) {
                        TripCoverages[j].name = coverage.name;
                        TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit);
                        
                        if (coverage.dailyLimit != null) {
                            TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                        }
                        if (coverage.percentageLimitofTripCost != null) {
                            TripCoverages[j].coverage = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(tripCost);
                        }
                        if (TripCoverages[j].ratingId == "CRCC") {
                            TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " Per Car";
                        }
                        break;
                    }
                }
            }

            for (var i = 0; i < policyCoverages.optional.length; i++) {
                var coverage = policyCoverages.optional[i];
                for (var j = 0; j < TripCoverages.length; j++) {
                    if (coverage.ratingId == TripCoverages[j].ratingId) {
                        TripCoverages[j].name = coverage.name;
                        TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit);

                        if (coverage.dailyLimit != null) {
                            TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                        }
                        if (coverage.percentageLimitofTripCost != null) {
                            TripCoverages[j].coverage = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(tripCost);
                        }
                        if (TripCoverages[j].ratingId == "CRCC") {
                            TripCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " Per Car";
                        }
                        break;
                    }
                }
            }

            for (var j = 0; j < TripCoverages.length; j++) {
                if (TripCoverages[j].Upgrades.length > 0) {
                    for (var k = 0; k < TripCoverages[j].Upgrades.length; k++) {
                        for (var i = 0; i < policyCoverages.optional.length; i++) {
                            var coverage = policyCoverages.optional[i];
                            if (coverage.ratingId == TripCoverages[j].Upgrades[k].ratingId) {
                                TripCoverages[j].Upgrades[k].name = coverage.name;
                                TripCoverages[j].Upgrades[k].coverage = "$" + commaSeparateNumber(coverage.coverageLimit);

                                if (coverage.dailyLimit != null) {
                                    TripCoverages[j].Upgrades[k].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                                }
                                if (coverage.percentageLimitofTripCost != null) {
                                    TripCoverages[j].Upgrades[k].coverage = coverage.percentageLimitofTripCost + "% of Trip Cost"
                                }

                                if (TripCoverages[j].ratingId != "BD") {
                                    TripCoverages[j].coverage = "";
                                }
                                break;
                            }
                        }
                    }
                }
            }

            return TripCoverages;
        }

        /**
         * @description
         * map from server policy object coverages to entity understood by the client side for medical
         */
        function mapFromCoverageMedical(policyCoverages, purchaseDate, tripCost) {
            var MedicalCoverages = [];
            MedicalCoverages.push({
                "ratingId": "MES", name: "", coverage: "$25,000", "Upgrades": [
                    { "ratingId": "MESU", name: "", coverage: "$50,000" },
                    { "ratingId": "MES.MESU", name: "", coverage: "$50,000" }
                ]
            });
            MedicalCoverages.push({
                "ratingId": "MEPS", name: "", coverage: "$25,000",
                "Upgrades": [
                    { "ratingId": "MEPUS", name: "", coverage: "$50,000" },
                    { "ratingId": "MEPS.MEPUS", name: "", coverage: "$50,000" }
                ]
            });
            MedicalCoverages.push({
                "ratingId": "MEP_PLUS", name: "", coverage: "$25,000",
                "Upgrades": [
                    { "ratingId": "MEP_PLUSU", name: "", coverage: "$50,000" },
                    { "ratingId": "MESU.EEU", name: "", coverage: "$50,000" },
                    { "ratingId": "MESU", name: "", coverage: "$50,000" },
                    { "ratingId": "MEP_PLUS.MESU", name: "", coverage: "$50,000" },
                ]
            });
            MedicalCoverages.push({
                "ratingId": "EE", name: "", coverage: "$500,000", "Upgrades": [
                    { "ratingId": "EEU", name: "", coverage: "$1,000,000" },
                    { "ratingId": "EE.EEU", name: "", coverage: "$1,000,000" }
                ]
            });
            MedicalCoverages.push({
                "ratingId": "AD", name: "", coverage: "$10,000", "Upgrades": []
            });
            MedicalCoverages.push({
                "ratingId": "FA_PLUS", name: "", coverage: "$50,000", "Upgrades":
                    [
                        { "ratingId": "FAU", name: "", coverage: "" },
                        { "ratingId": "FAU_PLUS", name: "", coverage: "" },
                        { "ratingId": "FAU_PLUS.FAU", name: "", coverage: "" },
                        { "ratingId": "FA_PLUS.FAU", name: "", coverage: "" }
                    ]
            });
            MedicalCoverages.push({
                "ratingId": "FAU", name: "", coverage: "", "Upgrades": []
            });

            MedicalCoverages.push({
                "ratingId": "FA", name: "", coverage: "", "Upgrades": [
                    { "ratingId": "FAU", name: "", coverage: "" }
                ]
            });

            var blnPrimaryFound = false;
            for (var i = 0; i < policyCoverages.included.length; i++) {
                if (policyCoverages.included[i].type == "Extra" || policyCoverages.included[i].type == "Extra Upgrade") {
                    blnPrimaryFound = true;
                }
            }
            var blnFA_PLUS = false;
            for (var i = 0; i < policyCoverages.included.length; i++) {
                var coverage = policyCoverages.included[i];
                for (var j = 0; j < MedicalCoverages.length; j++) {
                    if (coverage.ratingId == MedicalCoverages[j].ratingId) {
                        MedicalCoverages[j].name = coverage.name;
                        MedicalCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit);
                        if (coverage.ratingId == "MEP_PLUS" && blnPrimaryFound) {
                            MedicalCoverages[j].name = "* " + coverage.name;
                        }
                        if (coverage.ratingId == "FA_PLUS" && blnPrimaryFound) {
                            MedicalCoverages[j].name = "* " + coverage.name;
                            blnFA_PLUS = true;
                        }
                        break;
                    }
                }
            }

            for (var i = 0; i < policyCoverages.optional.length; i++) {
                var coverage = policyCoverages.optional[i];
                for (var j = 0; j < MedicalCoverages.length; j++) {
                    if (coverage.ratingId == MedicalCoverages[j].ratingId) {
                        if(!blnFA_PLUS) {
                        MedicalCoverages[j].name = coverage.name;
                        MedicalCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit);
                        }
                        
                        if (coverage.dailyLimit != null) {
                            MedicalCoverages[j].coverage = "$" + commaSeparateNumber(coverage.coverageLimit) + " ($" + coverage.dailyLimit + "/day)";
                        }
                        if (coverage.percentageLimitofTripCost != null) {
                            MedicalCoverages[j].coverage = coverage.percentageLimitofTripCost + "% of $" + commaSeparateNumber(parseFloat(tripCost));
                        }
                        if (coverage.ratingId == "FAU" && blnPrimaryFound && !blnFA_PLUS) {
                            MedicalCoverages[j].name = "* " + coverage.name;
                        }
                        break;
                    }
                }
            }

            for (var j = 0; j < MedicalCoverages.length; j++) {
                if (MedicalCoverages[j].Upgrades.length > 0) {
                    for (var k = 0; k < MedicalCoverages[j].Upgrades.length; k++) {
                        for (var i = 0; i < policyCoverages.optional.length; i++) {
                            var coverage = policyCoverages.optional[i];
                            if (coverage.ratingId == MedicalCoverages[j].Upgrades[k].ratingId) {
                                if (coverage.ratingId == "EE.EEU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "MES.MESU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "MEP_PLUS.MESU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    if (blnPrimaryFound) {
                                        MedicalCoverages[j].name = "* " + coverage.name.replace("Upgrade", "");
                                    }
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "MEP_PLUSU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    if (blnPrimaryFound) {
                                        MedicalCoverages[j].name = "* " + coverage.name.replace("Upgrade", "");
                                    }
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "MEPS.MEPUS") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade","");
                                    if (blnPrimaryFound) {
                                        MedicalCoverages[j].name = "* " + coverage.name.replace("Upgrade", "");
                                    }
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "FAU_PLUS.FAU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    if (blnPrimaryFound) {
                                        MedicalCoverages[j].name = "* " + coverage.name.replace("Upgrade", "");
                                    }
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                if (coverage.ratingId == "FA_PLUS.FAU") {
                                    MedicalCoverages[j].name = coverage.name.replace("Upgrade", "");
                                    if (blnPrimaryFound) {
                                        MedicalCoverages[j].name = "* " + coverage.name.replace("Upgrade", "");
                                    }
                                    MedicalCoverages[j].coverage = "$0";
                                }
                                MedicalCoverages[j].Upgrades[k].name = coverage.name;
                                var parentCoverageLimit = parseInt(MedicalCoverages[j].coverage.replace("$", "").replace(",", ""));
                                var newCoverageLimit = coverage.coverageLimit + parentCoverageLimit
                                MedicalCoverages[j].Upgrades[k].coverage = "$" + commaSeparateNumber(newCoverageLimit);
                                MedicalCoverages[j].coverage = "";
                                break;
                            }
                        }
                    }
                }
            }

            return MedicalCoverages;
        }

        function commaSeparateNumber(inputNumber) {
            inputNumber = inputNumber + "";
            var decimalPart = "";
            if (inputNumber.split('.').length > 1) {
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
        };
    }
})();