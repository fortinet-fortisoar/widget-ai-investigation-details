/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/**
 * @ngdoc directive
 * @name cybersponse.directive:hypothesisQuestionDetailSection
 * @module cybersponse
 * @restrict A
 *
 * @description
 * The `hypothesisQuestionDetailSection` render the fields of data 
 *
 **/
(function() {
  angular
    .module('cybersponse')
    .directive('hypothesisQuestionDetailSection', hypothesisQuestionDetailSection);

  hypothesisQuestionDetailSection.$inject = ['aiInvestigationDetailsService'];

  function hypothesisQuestionDetailSection(aiInvestigationDetailsService) {
    var directive = {
      restrict: 'E',
      scope: {
        currentQuestionDetail: '<?',
        traceFlow: '=',
        closeDetails: '&'
      },
      templateUrl: 'widgets/installed/aiInvestigationDetails-1.1.0/widgetAssets/directives/hypothesisQuestionDetailSection.html',
      link: link,
    }

    function link(scope, element) {
      scope.showTraceFlowPanel = function($event) {
        scope.traceFlow.visible = true;
        scope.showLine = true;

        const clickedEl = $event.currentTarget; // IMPORTANT

        const rect = clickedEl.getBoundingClientRect();
        const parent = document.querySelector('.questions-details-block');
        const parentRect = parent.getBoundingClientRect();
        const relativeTop = rect.top - parentRect.top + rect.height / 2;

      };
      scope.closeTraceFlow = function() {
        scope.traceFlow.visible = false;
        scope.showLine = false;
      };

      scope.$on('$destroy', function () {});
    }
    
    return directive;
  }
})();
