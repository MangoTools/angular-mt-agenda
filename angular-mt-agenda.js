'use strict';

angular.module('angular.mt.agenda', [])
    .directive('mtAgenda', [ function() {
        return {
            restrict: 'AE',
            scope: {
                ngModel:'=',
                config: '=',
                selected: '='
            },
            replace: true,
            template:
            '<div class="angular-mt-agenda">' +
            '   <div class="mg-header">' +
            '       <h2 class="mg-title-left"><a class="previews-month" ng-click="gotoPreviewsMonth($event)">&laquo; </a></h2>' +
            '       <h2 class="mg-title-right"><a class="next-month" ng-click="gotoNextMonth($event)"> &raquo;</a></h2>' +
            '       <div class="mg-title"><h2>{{base.format(\'MMMM YYYY\')}}</h2></div>' +
            '   </div>' +
            '   <div class="mg-body">' +
            '       <table class="mg-table" ng-style="{{tableStyle}}">' +
            '           <thead>' +
            '               <tr>' +
            '                   <th class="mg-table-header mg-table-header-picture">Picture</th>' +
            '                   <th class="mg-table-header mg-table-header-name" ng-click="predicate = \'name\'; reverse=!reverse">Name <i class="fa pull-right" ng-class="{\'fa-angle-up\': !reverse, \'fa-angle-down\': reverse}"></i></th>' +
            '                   <th ng-repeat="day in calendar.days" class="mg-table-header mg-table-header-day" ng-class="day.class">{{day.date.date()}}</th>' +
            '               </tr>' +
            '           </thead>' +
            '           <tbody>' +
            '               <tr ng-repeat="item in ngModel | orderBy:predicate:reverse" class="mg-item" ng-class="{selected: item.selected}">' +
            '                   <td class="mg-item-img" ng-click="select(item)"><img ng-src="{{item.imgUrl}}"></td>' +
            '                   <td class="mg-item-name" ng-click="select(item)"">{{item.name}}</td>' +
            '                   <td ng-repeat="day in calendar.days" class="mg-item-day" ng-class="day.class"> </td>' +
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

                $scope.now = moment.utc();
                $scope.base = moment.utc({y:$scope.now.year(), M:$scope.now.month(), d:1});

                $scope.predicate = 'name';
                $scope.reverse = false;

                $scope.select = function(item){
                    if($scope.selected!==null){
                        $scope.selected.selected = false;
                    }
                    if($scope.selected !== item){
                        $scope.selected = item;
                        $scope.selected.selected = true;
                    }
                    else{
                        $scope.selected = null;
                    }
                };

                $scope.goToUrl = function(url){
                    $location.path(url);
                };

                $scope.$watch('base | json', function(){
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
                        items: $scope.ngModel
                    };

                    for(var i=moment.utc(firstDay); i.isBefore(lastDay); i.add(1,'d')) { // For each day
                        var day = {
                            date: moment.utc(i),
                            class: {}
                        };

                        day.class['is-we'] = (i.day()===6 || i.day()===0);
                        day.class['is-today'] = (i.isSame($scope.now, 'd'));
                        day.class['is-other-month'] = (i.isBefore(firstMonthDay) || i.isAfter(lastMonthDay));
                        day.class['selectable'] = (i.isBefore(firstMonthDay) || i.isAfter(lastMonthDay));
                        $scope.calendar.days.push(day);
                    }


                };

                updateTable($scope.base);
            }
        }
    }]);
