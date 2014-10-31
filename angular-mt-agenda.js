'use strict';

angular.module('angular.mt.agenda', [])
    .directive('mtAgenda', [ function() {
        return {
            restrict: 'AE',
            scope: {
                ngModel:'=',
                config: '=',
                selectedItem: '='
            },
            replace: true,
            template:
            '<div class="mt-agenda">' +
            '   <div class="mt-header">' +
            '       <h2 class="mt-title-left"><a class="previews-month" ng-click="gotoPreviewsMonth($event)">&laquo; </a></h2>' +
            '       <h2 class="mt-title-right"><a class="next-month" ng-click="gotoNextMonth($event)"> &raquo;</a></h2>' +
            '       <div class="mt-title"><h2>{{base.format(\'MMMM YYYY\')}}</h2></div>' +
            '   </div>' +
            '   <div class="mt-body">' +
            '       <table class="mt-table" ng-style="{{tableStyle}}">' +
            '           <thead>' +
            '               <tr>' +
            '                   <th class="mt-table-header mt-table-header-picture">Picture</th>' +
            '                   <th class="mt-table-header mt-table-header-name" ng-click="predicate = \'data.name\'; reverse=!reverse">Name <i class="fa pull-right" ng-class="{\'fa-angle-up\': !reverse, \'fa-angle-down\': reverse}"></i></th>' +
            '                   <th ng-repeat="day in calendar.days" class="mt-table-header mt-table-header-day" ng-class="day.class">{{day.date | amDateFormat:\'DD\'}}</th>' +
            '               </tr>' +
            '           </thead>' +
            '           <tbody>' +
            '               <tr ng-repeat="item in calendar.items | orderBy:predicate:reverse" class="mt-item" ng-class="{selected: item.data.selected}">' +
            '                   <td class="mt-item-img" ng-click="selectLine(item)"><img ng-src="{{item.data.imgUrl}}"></td>' +
            '                   <td class="mt-item-name" ng-click="selectLine(item)"">{{item.data.name}}</td>' +
            '                   <td ng-repeat="day in item.days" class="mt-item-day" ng-class="day.class" ng-click="selectDay(item, day, $index)"> </td>' +
            '               </tr>' +
            '           </tbody>' +
            '       </table>' +
            '   </div>' +
            '</div>',

            link: function postLink(scope, element) {
                $(element).disableSelection();
            },
            controller: function($scope, $element, $location) {

                $scope.config = $scope.config || {};
                $scope.config.firstDayOfWeek = $scope.config.firstDayOfWeek || 6;
                $scope.config.canGoBeforeToday = $scope.config.canGoBeforeToday || false;
                $scope.config.minHeight = $scope.config.minHeight || '300px';
                $scope.config.onSelectDay = $scope.config.onSelectDay || null;                  // Call at the end of a day click
                $scope.config.onSelectItem = $scope.config.onSelectItem || null;                // Call at the end of an item click

                $scope.now = moment.utc();
                $scope.base = moment.utc({y:$scope.now.year(), M:$scope.now.month(), d:1});

                $scope.predicate = 'data.name';
                $scope.reverse = false;

                $scope.goToUrl = function(url){
                    $location.path(url);
                };

                $scope.$watch('base | json', function(){
                    updateTable($scope.base);
                });

                $scope.$watch('ngModel', function(){
                    updateTable($scope.base);
                });

                $scope.gotoPreviewsMonth = function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    if($scope.config.canGoBeforeToday || moment().isBefore(moment($scope.base).subtract(1,'month'), 'months')){
                        $scope.base.subtract(1, 'months');
                    }
                }
                $scope.gotoNextMonth = function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    $scope.base.add(1, 'months');
                }

                var selectedDay = null;
                $scope.selectDay = function(item, day){

                    day.class.selected = !day.class.selected;
                    if(angular.isFunction($scope.selectLine)) $scope.config.onSelectDay(item, day); // Can be overwrite outside

                    if(day.class.selected){
                        if(selectedDay!==null && selectedDay !== day){
                            selectedDay.class.selected = false;
                        }
                        selectedDay = day;

                        // Also select line if not selected
                        if($scope.selectedItem !== item.data) {
                            if ($scope.selectedItem !== null) {
                                $scope.selectedItem.selected = false;
                            }
                            $scope.selectedItem = item.data;
                            $scope.selectedItem.selected = true;
                            if(angular.isFunction($scope.config.onSelectItem)) $scope.config.onSelectItem(item);
                        }
                    }
                    else{
                        selectedDay = null;
                    }


                }

                $scope.selectLine = function(item){
                    if($scope.selectedItem!==null){
                        // First deselect day if any
                        if(selectedDay)
                        {
                            selectedDay.class.selected = false;
                            if(angular.isFunction($scope.selectLine)) $scope.config.onSelectDay(item, selectedDay); // Can be overwrite outside
                        }
                        $scope.selectedItem.selected = false;
                    }
                    if($scope.selectedItem !== item.data){
                        $scope.selectedItem = item.data;
                        $scope.selectedItem.selected = true;
                    }
                    else{
                        $scope.selectedItem = null;
                    }

                    if(angular.isFunction($scope.config.onSelectItem)) $scope.config.onSelectItem(item);
                };

                var updateTable = function(base) {

                    var firstMonthDay = moment.utc(base);

                    // First week that include the first day of the month
                    var firstDay = moment.utc(firstMonthDay);
                    if (firstDay.day() !== $scope.config.firstDayOfWeek) {
                        firstDay.day($scope.config.firstDayOfWeek).subtract(7, 'd');
                    }

                    // Last day of the month
                    var lastMonthDay = moment.utc(base).endOf('month');
                    // Last day of the week that include the last day of the month
                    var lastDay = moment.utc(lastMonthDay).day(($scope.config.firstDayOfWeek + 6) % 7); // End on friday

                    $scope.calendar = {
                        firstDay: firstDay,
                        lastDay: lastDay,
                        firstMonthDay: firstMonthDay,
                        lastMonthDay: lastMonthDay,
                        days: [],
                        items: []
                    };

                    for(var i=0; i<$scope.ngModel.length; i++){
                        $scope.calendar.items.push({data: $scope.ngModel[i], days: []});
                    }

                    for(var i=moment.utc(firstDay); i.isBefore(lastDay); i.add(1,'d')) { // For each day
                        var day = {
                            date: moment.utc(i),
                            class: {}
                        };

                        day.class['is-we'] = (i.day()===6 || i.day()===0);
                        day.class['is-today'] = (i.isSame($scope.now, 'd'));
                        day.class['is-other-month'] = (i.isBefore(firstMonthDay) || i.isAfter(lastMonthDay));
                        $scope.calendar.days.push(day);
                        for(var j=0; j<$scope.calendar.items.length; j++){
                            var newDayData = { date: day.date, class: angular.copy(day.class)};
                            $scope.calendar.items[j].days.push(newDayData);
                        }
                    }

                    if(angular.isFunction($scope.config.onTableUpdate)){
                        $scope.config.onTableUpdate($scope.calendar);
                    }
                };

                updateTable($scope.base);
            }
        }
    }]);
