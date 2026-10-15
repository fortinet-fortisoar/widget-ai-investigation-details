/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/**
 * @ngdoc directive
 * @name cybersponse.directive:hypothesisDetails
 * @module cybersponse
 * @restrict A
 *
 * @description
 * The `hypothesisDetails` render the fields of data 
 *
 **/
(function() {
  angular
    .module('cybersponse')
    .directive('hypothesisDetails', hypothesisDetails);

  hypothesisDetails.$inject = ['$sce', '$http', '$timeout', '$filter', 'aiInvestigationDetailsService', '$templateCache'];

  function hypothesisDetails($sce, $http, $timeout, $filter, aiInvestigationDetailsService, $templateCache) {
    var directive = {
      restrict: 'E',
      scope: {
        currentHypothesisData: '<?',
        backToSummary: '&',
        showSummaryWindow: '='
      },
      templateUrl: 'widgets/installed/aiInvestigationDetails-1.1.0/widgetAssets/directives/hypothesisDetails.html',
      link: link,
    }

    function link(scope, element){
      scope.traceFlow = {
        visible: false
      };
      scope.showLine = false;
      scope.currentHypothesisData = scope.currentHypothesisData;
      scope.showQuestionDetails = false;
      scope.PATH_HYPOTHESIS_DETAILS = `${ aiInvestigationDetailsService.getWidgetBasePath() }widgetAssets/directives/hypothesisDetailsSection.html`;
      const hypothesisDetailsGlow = `${ aiInvestigationDetailsService.getWidgetBasePath() }widgetAssets/images/Hypo_Detail_Glow.svg`;
      let loadedSVGDocument = undefined;
      let svgLoaded = false;
      const el = element[0]; 
      init();

      function init() {
        addListener();
        preventHorizontalNavigation();
        var hypothesisDetailsGlowSVG = $templateCache.get(hypothesisDetailsGlow);
        if (!hypothesisDetailsGlowSVG) {
          $http.get(hypothesisDetailsGlow).then(function (response) {
            $templateCache.put(hypothesisDetailsGlow, angular.copy(response.data));
            scope.hypothesisDetailsGlowContent = $sce.trustAsHtml(response.data);
            _loadPieChart();
          });
        } else {
          scope.hypothesisDetailsGlowContent = $sce.trustAsHtml(hypothesisDetailsGlowSVG);
          _loadPieChart();
        }
      }

      function _loadPieChart() {
        $timeout(function () {
          const svgEl = document.querySelector('#hypothesisDetailsGlow svg');
          if (svgEl) {
            loadedSVGDocument = svgEl;
            svgLoaded = true;
            drawPieChart(svgEl);
          }
        }, 10);
      }

       scope.$watch('showSummaryWindow', function (newVal, oldVal) {
          if(newVal === false){
              drawPieChart(loadedSVGDocument);
          }
       });

      scope.activeIndex = null;

      scope.setActiveQuestion = function (index) {
        scope.activeIndex = index;
      };

      function addListener() {
        document.querySelectorAll('.question-listing').forEach(el => {
          el.addEventListener('click', clickHandler);
        });
      }

      function clickHandler(){
        const rect = this.getBoundingClientRect();
            const parent = document.querySelector('.hypothesis-questions-block');
            const parentRect = parent.getBoundingClientRect();
            const relativeTop = rect.top - parentRect.top + rect.height / 2;
            const relativeLeft = rect.width;
            parent.style.setProperty('--line-left', `${relativeLeft}px`);
      }

      function drawPieChart(pieGlow) {
        const elementData = scope.currentHypothesisData;
        if (!elementData) return;

        let svg = pieGlow;
        if (!svg) return;

        // -------- Clear previous donut --------
        svg.querySelectorAll(
          '.donut-bg, .donut-weaken, .donut-support, .donut-detail'
        ).forEach(n => n.remove());

        // -------- SVG geometry --------
        const width =
          svg.viewBox?.baseVal?.width || svg.clientWidth;
        const height =
          svg.viewBox?.baseVal?.height || svg.clientHeight;

        const cx = width / 2;
        const cy = height / 2;
        const radius = 100;

        // -------- Constants --------
        const NS = 'http://www.w3.org/2000/svg';
        const green = '#128A3D';
        const red = '#C93420';
        const defaultBGColor = 'rgba(118, 128, 146, 0.25)';
        let bgColor = 'rgba(118, 128, 146, 0.25)';

        const strokeWidth = 6;
        // -------- Data --------
        const supports = elementData.supports?.length || 0;
        const weakens = elementData.weakens?.length || 0;
        const total = supports + weakens || 1;

        const supportPercent = supports / total;
        const weakenPercent = weakens / total;

        const circumference = 2 * Math.PI * radius;
        const supportLength = supportPercent * circumference;
        const weakenLength = weakenPercent * circumference;

        bgColor = elementData.attentionNeeded === 'Yes' ? red : defaultBGColor;
        let attentionNeeded = elementData.attentionNeeded === 'Yes' ? true : false;
        
        // -------- Background --------
        const bgDetail = document.createElementNS(NS, 'circle');
        bgDetail.setAttribute('cx', cx + 2);
        bgDetail.setAttribute('cy', cy);
        bgDetail.setAttribute('r', radius);
        bgDetail.setAttribute('fill', 'none');
        bgDetail.setAttribute('stroke', bgColor);
        bgDetail.setAttribute('stroke-width', strokeWidth);
        bgDetail.setAttribute('class', 'donut-bg');

        svg.appendChild(bgDetail);

        // -------- Weaken arc --------
        if (weakens > 0) {
          const weakenArcDetail = document.createElementNS(NS, 'circle');
          weakenArcDetail.setAttribute('cx', cx);
          weakenArcDetail.setAttribute('cy', cy);
          weakenArcDetail.setAttribute('r', radius);
          weakenArcDetail.setAttribute('fill', 'none');
          weakenArcDetail.setAttribute('stroke', red);
          weakenArcDetail.setAttribute('stroke-width', strokeWidth);
          weakenArcDetail.setAttribute('stroke-linecap', 'round');
          weakenArcDetail.setAttribute(
            'stroke-dasharray',
            `${weakenLength} ${circumference}`
          );
          weakenArcDetail.setAttribute('stroke-dashoffset', 0);
          weakenArcDetail.setAttribute(
            'transform',
            `rotate(-90 ${cx} ${cy})`
          );
          weakenArcDetail.setAttribute('class', 'donut-weaken');
        }

        // -------- Support arc --------
        if (supports > 0) {
          const supportArcDetail = document.createElementNS(NS, 'circle');
          supportArcDetail.setAttribute('cx', cx);
          supportArcDetail.setAttribute('cy', cy);
          supportArcDetail.setAttribute('r', radius);
          supportArcDetail.setAttribute('fill', 'none');
          supportArcDetail.setAttribute('stroke', green);
          supportArcDetail.setAttribute('stroke-width', strokeWidth);
          supportArcDetail.setAttribute('stroke-linecap', 'round');
          supportArcDetail.setAttribute(
            'stroke-dasharray',
            `${supportLength} ${circumference}`
          );
          supportArcDetail.setAttribute(
            'stroke-dashoffset',
            -weakenLength
          );
          supportArcDetail.setAttribute(
            'transform',
            `rotate(-90 ${cx} ${cy})`
          );
          supportArcDetail.setAttribute('class', 'donut-support');
        }
        /* -------- CENTER LABEL -------- */
        const detailObject = document.createElementNS(NS, 'foreignObject');
        detailObject.setAttribute('x', (cx - radius) + 2);
        detailObject.setAttribute('y', cy - radius + 20);
        detailObject.setAttribute('width', radius * 2);
        detailObject.setAttribute('height', radius * 2);
        detailObject.setAttribute('class', `donut-detail`);

        const _intent = $filter('titlecase')(elementData.intent)+'?';

        const div = document.createElement('div');
        div.className = 'internalHypothesisText text-center';
        let htmlContent = `
              <div>#${elementData.hypoIndex}</div>
              <div class="hypothesisDescription margin-top-sm truncate-text-3" title="${elementData.name}">${elementData.name}</div>
              <div class="margin-top-30 truncate width-130 text-capitalize internalIntentValue font-size-16" title="${_intent}">${_intent}</div>`;

        if (elementData.intentStatus) {
          const statusClass = (elementData.intentStatus)
            .toLowerCase()
            .replace(/\s+/g, '_');

          let statusIcon = 'fa-exclamation-triangle';
          let statusText = $filter('humanize')(elementData.intentStatus);
          
          const showIcon = attentionNeeded; // boolean
            const iconHtml = showIcon
              ? `<i class="fa ${statusIcon}"></i>`
              : '';
            htmlContent += `
                <div class="intentStatus padding-left-md padding-right-md width-fit-content text-capitalize bold">
                  ${statusText.toLowerCase()}
                </div>
              `;
        }
        div.innerHTML = htmlContent;
        detailObject.appendChild(div);

        svg.appendChild(detailObject);


      }

      scope.closeQuestions = function(){
        scope.backToSummary();
      }

      scope.showQuestionPanel = function (currentQuestionDetails, $event) {
        scope.showQuestionDetails = true;
        scope.currentQuestionDetails = currentQuestionDetails;
        scope.showLine = true;

        const clickedEl = $event.currentTarget; // IMPORTANT

        const rect = clickedEl.getBoundingClientRect();
        const parent = document.querySelector('.hypothesis-questions-block');
        const parentRect = parent.getBoundingClientRect();
        const relativeTop = rect.top - parentRect.top + rect.height / 2;
      }

      scope.closeQuestionDetails = function(){
        scope.showQuestionDetails = false;
        scope.showLine = false;
        scope.traceFlow.visible = false;
      }

      scope.closeDetails = function(){
        scope.traceFlow.visible = false;
        scope.backToSummary();
        scope.showQuestionDetails = false;
        scope.showLine = false;
      }

      //to prevent default behaviour of browser of back and forward navigation
      //by default, wheel listeners as passive
      function preventHorizontalNavigation() {
        const _page = element[0].querySelector('.summaryPageContainer');
        if(_page) {
          _page.addEventListener('wheel', wheelHandler, { passive: false });
        }
      }

      function wheelHandler(e) {
          if (e.deltaX !== 0) {
            e.preventDefault();
          }
      }

      scope.$on('$destroy', function () {
        el.removeEventListener('click', clickHandler);
        el.removeEventListener('wheel', wheelHandler);
      });

    }
    
    return directive;
  }
})();
