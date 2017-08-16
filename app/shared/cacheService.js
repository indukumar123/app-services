(function() {
    'use strict';

    angular.module('agentPortal')
        .factory('cacheService', ['$cacheFactory', cacheService]);
 
    function cacheService($cacheFactory) {
        var lastCacheTime = new Date();
        var $httpDefaultCache = $cacheFactory.get('$http');

        return {
            invalidateCacheIfNeeded: invalidateCacheIfNeeded,
            invalidateCaches: invalidateCaches
        };

        function invalidateCacheIfNeeded() {
            if (isRefreshNeeded()) {
                invalidateCaches();
            }
        }

        function invalidateCaches() {
            $httpDefaultCache.removeAll();
            lastCacheTime = new Date();
        }

        function isRefreshNeeded() {
            var configMinutesAgo = new Date();
            configMinutesAgo.setMinutes(configMinutesAgo.getMinutes() - global_client_cache_refresh_minutes);
            return lastCacheTime < configMinutesAgo;
        }
    }
})();
