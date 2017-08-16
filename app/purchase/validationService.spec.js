describe('validationService', function () {

    var validationService;
    var productConstant;

    beforeEach(module('agentPortal'));

    beforeEach(inject(function (_validationService_) {
        validationService = _validationService_;
    }));

    describe('validationService init tests', function () {
        it('should be created successfully', function () {
            expect(validationService).toBeDefined;
        });
    });

    describe('validationService', function () {
        beforeEach(inject(function (_productConstant_) {
            productConstant = _productConstant_;
        }));

        it('should validate a valid form for formToValidate', function () {
            var result = validationService.validate('myForm', productConstant.Product.exactcare, 1);
            expect(result).toEqual(true);
        });

        it('should validate invalid form for formToValidate', function () {
            var func = function MyFunc() { alert("I'm a function"); }
            func.$invalid = true;
            var result = validationService.validate(func, productConstant.Product.exactcare, 1);
            expect(result).toEqual(false);
        });

        it('should validate valid exactcare Product', function () {
            var result = validationService.validate('myForm', productConstant.Product.exactcare, 1);
            expect(result).toEqual(true);
        });

        it('should validate valid aircare Product', function () {
            var result = validationService.validate('myForm', productConstant.Product.aircare, 1);
            expect(result).toEqual(true);
        });

        it('should validate invalid Product', function () {
            var result = validationService.validate('myForm', productConstant.Product.fluffy, 1);
            expect(result).toEqual(false);
        });
    });

});