angular.module('GeekService', []).factory('Geek', ['$http','$q', function($http,$q) {
	
	return({
        addFriend: addFriend,
        getFriends: getFriends,
        removeFriend: removeFriend
    });
	
	
	 // ---
    // PUBLIC METHODS.
    // ---
    // I add a friend with the given name to the remote collection.
    function addFriend( name ) {
        var request = $http({
            method: "post",
            url: "api/index.cfm",
            params: {
                action: "add"
            },
            data: {
                name: name
            }
        });
        return( request.then( handleSuccess, handleError ) );
    }
    // I get all of the friends in the remote collection.
    function getFriends() {
        var request = $http({
            method: "get",
            url: "localhost:9080/res/api/v1/rulesets",
            params: {
                action: "get"
            }
        });
        return( request.then( handleSuccess, handleError ) );
    }
    // I remove the friend with the given ID from the remote collection.
    function removeFriend( id ) {
        var request = $http({
            method: "delete",
            url: "api/index.cfm",
            params: {
                action: "delete"
            },
            data: {
                id: id
            }
        });
        return( request.then( handleSuccess, handleError ) );
    }
    // ---
    // PRIVATE METHODS.
    // ---
    // I transform the error response, unwrapping the application dta from
    // the API response payload.
    function handleError( response ) {
        // The API response from the server should be returned in a
        // nomralized format. However, if the request was not handled by the
        // server (or what not handles properly - ex. server error), then we
        // may have to normalize it on our end, as best we can.
        if (
            ! angular.isObject( response.data ) ||
            ! response.data.message
            ) {
            return( $q.reject( "An unknown error occurred." ) );
        }
        // Otherwise, use expected error message.
        return( $q.reject( response.data.message ) );
    }
    // I transform the successful response, unwrapping the application data
    // from the API response payload.
    function handleSuccess( response ) {
        return( response.data );
    }
	
	
	
	}]);