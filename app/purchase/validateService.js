(function () {
    'use strict';

    angular.module('agentPortal')
        .factory('validationService', validationService)
        .constant('productConstant', {
            Product: {
                aircare: 'aircare',
                exactcare: 'exactcare'
            }
        });

    validationService.$inject = ['productConstant'];

    function validationService(productConstant) {

        return {
            validate: validate
        };
        
        function validate(formToValidate, productToValidate, step) {
            var isValid = true;
            if (productToValidate == productConstant.Product.aircare) {
                isValid = validateForm(formToValidate);
                // Additional Traveler Infomration
                if (formToValidate.travelerForm !== undefined) {
                    if(!validate(formToValidate.travelerForm, productConstant.Product.aircare, step) && isValid)
                        isValid = false;
                }
            }
            else if (productToValidate == productConstant.Product.exactcare) {
                isValid = validateForm(formToValidate);
                // AdditionalTraveler Infomration
                if (formToValidate.additionalTravelerForm !== undefined) {
                    if (!validate(formToValidate.additionalTravelerForm, productConstant.Product.exactcare, step) && isValid)
                        isValid = false;
                }
            }
            else
            {
                // Invalid Product
                isValid = false;
            }

            return isValid;
        }

        function validateForm(form) {
            var isFormValid = true;

            if (form.$invalid) {
                angular.forEach(form.$error, function (input) {
                    angular.forEach(input, function (field) {

                        if (field.$name == "additionalTravelerForm") 
                            validateAdditionTravelerFields(field);

                        if (typeof field.$setTouched == 'function')
                            field.$setTouched();
                    })
                });
                isFormValid = false;
            }

            return isFormValid;
        }
        
        /********************************************* 
          Validate all Additional Travler Fields
        *********************************************/
        function validateAdditionTravelerFields(field) {
            if (field.relationToPrimary)
                field.relationToPrimary.$touched = true;
            if (field.lastName)
                field.lastName.$touched = true;
            if (field.firstName)
                field.firstName.$touched = true;
            if (field.dateOfBirth)
                field.dateOfBirth.$touched = true;
            if (field.tripCost)
                field.tripCost.$touched = true;
        }

    }
})();