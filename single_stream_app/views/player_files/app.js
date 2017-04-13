var app = angular.module('myApp', []); //the overall module




app.controller('myCtrl', function($scope, $timeout, $http){ //my controller... functions in here

	var timeout;		

	$scope.$watch('city', function(newCity) {
		if(newCity) {
			if(timeout) $timeout.cancel(timeout);
			timeout = $timeout(function() {
				$scope.getWeather();	
				},1000);
			};
		})

	



	$scope.getWeather = function(callback) {
	console.log("excuse you");
		// navigator.geolocation.getCurrentPosition( function(position) {
		// 	$scope.latitude = position.coords.latitude;
		// 	$scope.longitude = position.coords.longitude;
		// 	//console.log($scope.longitude);
		// 	if ($scope.latitude && $scope.longitude) {$scope.findData();} //calls the findData function (because otherwise this being asyncrhonous it screws everything up)

		// });
	};

	
	

	//$scope.getWeather(); //this starts us off by calling the getWeather function

});