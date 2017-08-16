describe('tramsService', function () {
    
    var tramsService;
    var $q;
    var policy;
    
    beforeEach(module('agentPortal'));
    
    beforeEach(inject(function (_tramsService_, _$q_) {
        tramsService = _tramsService_;
        $q = _$q_;

        policy = mockData.getPolicyForFnol();
    }));

    describe('tramsService init tests', function () {
        it('should be created successfully', function () {
            expect(tramsService).toBeDefined;
        });
    });


    describe('tramsService', function () {
        it('should return XML with EC reservation', function () {
            var policy = mockData.getPolicyForFnol();
            var trams = '';

            trams = tramsService.getTramsXml(policy, policy.travelers, 'exactcare');

            expect(trams).toContain('RESERVATION');
        });
    });

    describe('tramsService', function () {
        it('should return XML with aircare reservation', function () {
            var promise = getXml();
            promise.then(function () {
                expect(trams).toContain('aircare');
            });
        });
    });

    function getXml() {
        var deferred = $q.defer();
        var trams = tramsService.getTramsXml(policy.policy, policy.travelers, 'aircare');

        deferred.notify(trams);

        return deferred.promise;
    }

});