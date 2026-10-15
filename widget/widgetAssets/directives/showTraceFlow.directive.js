/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/**
 * @ngdoc directive
 * @name cybersponse.directive:showTraceFlow
 * @module cybersponse
 * @restrict A
 *
 * @description
 * The `showTraceFlow` render the fields of data 
 *
 **/
(function() {
  angular
    .module('cybersponse')
    .directive('showTraceFlow', showTraceFlow);

  showTraceFlow.$inject = [];

  function showTraceFlow() {
    var directive = {
      restrict: 'E',
      scope: {
        currentQuestionDetail: '<',
        closeTraceFlow: '&'
      },
      templateUrl: 'widgets/installed/aiInvestigationDetails-1.1.0/widgetAssets/directives/showTraceFlow.html',
      link: link,
    }

    function link(scope){
        
    }
    
    return directive;
  }
})();
