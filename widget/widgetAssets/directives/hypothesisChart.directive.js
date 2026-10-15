/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/**
 * @ngdoc directive
 * @name cybersponse.directive:hypothesisChart
 * @module cybersponse
 * @restrict A
 *
 * @description
 * The `hypothesisChart` render the fields of data 
 *
 **/
(function() {
  angular
    .module('cybersponse')
    .directive('hypothesisChart', hypothesisChart);

  hypothesisChart.$inject = ['$timeout', '$filter', '$rootScope', 'aiInvestigationDetailsService'];

  function hypothesisChart($timeout, $filter, $rootScope, aiInvestigationDetailsService) {
    var directive = {
      restrict: 'E',
      scope: {
        hypothesisData: '<?',
        summaryData: '<?',
        stepStatus: '<?',
        type: '@?',
        showDetailsWindow : '&',
        loadTraceFlow: '&'
      },
      templateUrl: $rootScope.theme.id === 'light' ? `widgets/installed/aiInvestigationDetails-1.1.0/widgetAssets/images/hypothesis_skeleton_light.svg`: `widgets/installed/aiInvestigationDetails-1.1.0/widgetAssets/images/hypothesis_skeleton.svg`,
      link: link,
    }

    function link(scope, element){
      let agentNameList = [];

      $timeout(function () {
        scope.hypothesisData = scope.hypothesisData;
        const svgEl = element[0].querySelector('svg');
        aiInvestigationDetailsService.fetchAgentList().then(function(response){
          agentNameList = response.data.agents;
          createAgentLabels(svgEl);
        })

        if (scope.stepStatus && scope.stepStatus !== 'completed' && scope.stepStatus !== 'failed') {
          document.querySelectorAll('[id^="Swirls_"]').forEach(el =>
            el.classList.remove('stop-spin')
          );
          createLoaderAnimation(svgEl);
        }
        if(scope.stepStatus && scope.stepStatus === 'failed'){
              document.querySelectorAll('[id^="Hypo_Ticker_"], [id^="Ellipse_Ticker_"], [id^="Swirls_"], [id^="Hypo_Circle_"],[id^="Hypo_Loader_"]').forEach(el =>{
                  el.classList.add('stop-spin');
              });
              document.querySelectorAll('[class="progress-bar"]').forEach(el =>{
                  el.classList.add('stop-spin');
              });   
        }
        // select the svg inside this directive only
        const svgD3 = d3.select(element[0]).select('svg');
        if(scope.hypothesisData &&  scope.hypothesisData.length>0){
          createDonutInEmbeddedSVG(scope.hypothesisData);
        }

      })

      let hypothesisDataWatch = scope.$watch('hypothesisData', function (newVal, oldVal) {
        if (!newVal) return;
        $timeout(function () {
          if (newVal && newVal.length > 0) {
            createDonutInEmbeddedSVG(newVal);
          } else {
            if(scope.stepStatus && scope.stepStatus !== 'failed' && scope.stepStatus !== 'completed'){
              resetDonutAttributes(newVal);
            }
          }
        });
      }, true);

      let stepStatusWatch = scope.$watchCollection('stepStatus', function (data) {
        scope.stepStatus = data;
            if (data && data === 'completed') {
              document.querySelectorAll('[id^="Swirls_"]').forEach(el =>{
                  el.classList.add('stop-spin');
                });
            }
            else if(data && data === 'failed'){
              document.querySelectorAll('[id^="Hypo_Ticker_"], [id^="Ellipse_Ticker_"], [id^="Swirls_"], [id^="Hypo_Circle_"],[id^="Hypo_Loader_"]').forEach(el =>{
                  el.classList.add('stop-spin');
              });
              document.querySelectorAll('[class="progress-bar"]').forEach(el =>{
                  el.classList.add('stop-spin');
              });   
            }
            else{
              resetDonutAttributes();
            }
      });

      function createLoaderAnimation(svgEl) {
         // Remove old loaders first
        document
          .querySelectorAll('[id^="inner-loader-"]')
          .forEach(el => el.remove());

        let count = 1;
        for(let count = 1; count <= 5; count++) {
          const innerLoader = document.getElementById(`Hypo_Loader_${count}`);
          innerLoader.classList.add('zero-opacity');
          /*---------- Inner loader -------*/
          const loaderBox = innerLoader.getBBox();
          const loaderWidth = (loaderBox.width);
          const loaderHeight = (loaderBox.height);
          const innerLoaderX = loaderBox.x;
          const innerLoaderY = loaderBox.y + 8;

          const innerLoaderAnim = document.createElementNS(innerLoader.namespaceURI, 'foreignObject');
          innerLoaderAnim.setAttribute('x', innerLoaderX);
          innerLoaderAnim.setAttribute('y', innerLoaderY);
          innerLoaderAnim.setAttribute('width', loaderWidth);
          innerLoaderAnim.setAttribute('height', loaderHeight);
          innerLoaderAnim.setAttribute('id', `inner-loader-${count}`);

          const loaderDiv = document.createElement('div');
          loaderDiv.className = 'loaderDiv';
          loaderDiv.innerHTML = `
              <div class="progress-container">
              <div class="progress-bar"></div>
              </div>`;

          innerLoaderAnim.appendChild(loaderDiv);
          svgEl.appendChild(innerLoaderAnim);
        }
      }

      function createAgentLabels(svgEl){
        document.querySelectorAll('[id^="agent_"]')
          .forEach(el =>
            el.classList.add('zero-opacity')
          );
        const AGENTLISTLENGTH = agentNameList.length;
        for(var i =  0; i<AGENTLISTLENGTH; i++){
          const agentSource = document.querySelector(`#agent_${i}`);
          const agentFO = document.createElementNS(agentSource.namespaceURI, 'foreignObject');
          const abbox = agentSource.getBBox();
          const acx = abbox.x - 30;
          const acy = abbox.y - 10;
          let _width = abbox.width + 30;
          let _height = 60;
          agentFO.setAttribute('x', acx);
          agentFO.setAttribute('y', acy);
          agentFO.setAttribute('width', _width);
          agentFO.setAttribute('height', _height);
          agentFO.setAttribute('id', `agent_label_${i}`);
          const agentLabelDiv = document.createElement('div');
          agentLabelDiv.innerHTML = agentNameList[i];
          agentLabelDiv.classList.add('font-size-14');
          agentLabelDiv.classList.add('text-align-right');
          agentFO.appendChild(agentLabelDiv);
          svgEl.appendChild(agentFO);
        }
        const el = document.getElementById('traceabilityWizard');
        el.setAttribute('pointer-events', 'all');
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () {
          scope.loadTraceFlow();
        });
      }

      function resetDonutAttributes() {
        document.querySelectorAll('[id^="Hypo_Ticker_"], [id^="Ellipse_Ticker_"], [id^="AI_Sparkle_"], [id^="Hypo_Circle_"],[id^="Hypo_Loader_"]')
          .forEach(el =>
            el.classList.remove('stop-spin', 'zero-opacity')
          );

        const svg = document.querySelector('svg'); // or your specific SVG reference
        svg.querySelectorAll('[class^="donut-weaken-"], [class^="donut-support-"], [class^="donut-fo-"],[class^="donut-bg-"]')
          .forEach(el => el.remove());

          document.querySelectorAll('[id^="Swirls_"]').forEach(el =>
            el.classList.remove('stop-spin')
            //el.classList.add('start-swirl-animation')
          );

        const fillColor = `#2F3542`; 
        document.querySelectorAll('[id^="Hypo_Circle_"]')
          .forEach(circle => {
            circle.setAttribute('fill', fillColor);
          });

          createLoaderAnimation(svg);
      }

    /**
     * Draws a donut chart inside an existing embedded SVG
     * @param {SVGElement} source - any element inside the SVG (used to locate svg)
     * @param {Number} percent - value from 0 to 100
     * @param {Object} opts - positioning options
    **/
      function createDonutInEmbeddedSVG(_hypothesisData) {
        // Get the SVG element
        let opts = {
          strokeWidth: 6
        };

        const green = '#128A3D';
        const red = '#C93420';
        const plainArcColor = '#8993A5';
        const defaultBGColor = $rootScope.theme.id ==='light'? '#A4ACBC': 'rgba(47, 53, 66, 1)';
        let bgColor = 'rgba(118, 128, 146, 0.25)';

        document.querySelectorAll('[id^="Hypo_Ticker_"]').forEach(el =>
          el.classList.add('stop-spin')
        );

        _hypothesisData.forEach((element, index) => {
          let _index = index + 1;
          const source = document.getElementById(`Hypo_${_index}`);
          if (!source) return;

          source.style.cursor = 'pointer';
          source.style.pointerEvents = 'all';
          source.data = element;

          const source_ticker = document.getElementById(`Hypo_Ticker_${_index}`);
          const innerCircle = document.getElementById(`Ellipse_Ticker_${_index}`);
          const innerSparkle = document.getElementById(`AI_Sparkle_${_index}`); 
          const innerFillCircle = document.getElementById(`Hypo_Circle_${_index}`);
          const innerLoader = document.getElementById(`Hypo_Loader_${_index}`);
          const innerProgressLoader = document.getElementById(`inner-loader-${_index}`);
          const innerNumber = document.getElementById(`#${_index}`);

          source_ticker.classList.add('zero-opacity');
          innerSparkle.classList.add('zero-opacity');
          innerNumber.classList.add('zero-opacity');
          innerLoader.classList.add('zero-opacity');

          const bbox = innerCircle.getBBox();
          const radius = (bbox.width) / 2;
          const cx = (bbox.x) + radius;
          const cy = (bbox.y) + radius;

          const total = element.weakens.length + element.supports.length || 1;

          const supportPercent = (element.supports.length / total) * 100;
          const weakenPercent = (element.weakens.length / total) * 100;

          const svg = source.ownerSVGElement || source;
          const NS = svg.namespaceURI;

          const circumference = 2 * Math.PI * radius;

          const supportLength = (supportPercent / 100) * circumference;
          const weakenLength = (weakenPercent / 100) * circumference;
          const plainArcLength = ( (100 - (weakenPercent + supportPercent)) / 100) * circumference;

          /* -------- CLEAN OLD -------- */
          svg.querySelectorAll(
            `.donut-bg-${_index}, .donut-support-${_index}, .donut-weaken-${_index}, .donut-fo-${_index}`
          ).forEach(el => el.remove());

          bgColor = element.attentionNeeded === 'Yes' ? red : defaultBGColor;
          let attentionNeeded = element.attentionNeeded === 'Yes' ? true : false;
          /* -------- BACKGROUND -------- */
          const bg = document.createElementNS(NS, 'circle');
          bg.setAttribute('cx', cx);
          bg.setAttribute('cy', cy);
          bg.setAttribute('r', radius);
          bg.setAttribute('fill', 'none');
          bg.setAttribute('stroke', bgColor);
          bg.setAttribute('stroke-width', opts.strokeWidth);
          bg.setAttribute('class', `donut-bg-${_index}`);

          /* -------- WEAKEN ARC (FIRST) -------- */
          const weakenArc = document.createElementNS(NS, 'circle');
          weakenArc.setAttribute('cx', cx);
          weakenArc.setAttribute('cy', cy);
          weakenArc.setAttribute('r', radius);
          weakenArc.setAttribute('fill', 'none');
          weakenArc.setAttribute('stroke', red);
          weakenArc.setAttribute('stroke-width', opts.strokeWidth);
          weakenArc.setAttribute('stroke-linecap', 'round');
          weakenArc.setAttribute(
            'stroke-dasharray',
            `${weakenLength} ${circumference}`
          );
          weakenArc.setAttribute('stroke-dashoffset', 0);
          weakenArc.setAttribute(
            'transform',
            `rotate(-90 ${cx} ${cy})`
          );
          weakenArc.setAttribute('class', `donut-weaken-${_index}`);

          /* -------- SUPPORT ARC (AFTER WEAKEN) -------- */
          const supportArc = document.createElementNS(NS, 'circle');
          supportArc.setAttribute('cx', cx);
          supportArc.setAttribute('cy', cy);
          supportArc.setAttribute('r', radius);
          supportArc.setAttribute('fill', 'none');
          supportArc.setAttribute('stroke', green);
          supportArc.setAttribute('stroke-width', opts.strokeWidth);
          supportArc.setAttribute('stroke-linecap', 'round');
          supportArc.setAttribute(
            'stroke-dasharray',
            `${supportLength} ${circumference}`
          );
          supportArc.setAttribute(
            'stroke-dashoffset',
            -weakenLength
          );
          supportArc.setAttribute(
            'transform',
            `rotate(-90 ${cx} ${cy})`
          );
          supportArc.setAttribute('class', `donut-support-${_index}`);

           /* -------- SUPPORT ARC (AFTER WEAKEN and Support) -------- */
          const plainArc = document.createElementNS(NS, 'circle');
          plainArc.setAttribute('cx', cx);
          plainArc.setAttribute('cy', cy);
          plainArc.setAttribute('r', radius);
          plainArc.setAttribute('fill', 'none');
          plainArc.setAttribute('stroke', plainArcColor);
          plainArc.setAttribute('stroke-width', opts.strokeWidth);
          plainArc.setAttribute('stroke-linecap', 'round');
          plainArc.setAttribute(
            'stroke-dasharray',
            `${plainArcLength} ${circumference}`
          );
          plainArc.setAttribute(
            'stroke-dashoffset',
            -(weakenLength + supportLength)
          );
          plainArc.setAttribute(
            'transform',
            `rotate(-90 ${cx} ${cy})`
          );
          plainArc.setAttribute('class', `donut-support-${_index}`);

          /* -------- CENTER LABEL -------- */
          const fo = document.createElementNS(NS, 'foreignObject');
          fo.setAttribute('x', cx - radius);
          fo.setAttribute('y', cy - radius - 15);
          fo.setAttribute('width', radius * 2);
          fo.setAttribute('height', radius * 2);
          fo.setAttribute('class', `donut-fo-${_index} foreignDonut`);


          fo.addEventListener('click', function () {
            showDetails(element, _index);
          });
          const _intent = $filter('titlecase')(element.intent)+'?';
          const div = document.createElement('div');
          div.className = 'hypothesisText text-center';
          let htmlContent =`
              <div>#${_index}</div>
              <div class="hypothesisDescription margin-top-sm truncate-text-3" title="${element.name}">${element.name}</div>
              <div class="margin-top-30 truncate width-111 font-size-14 intentValue" title="{_intent}">${_intent}</div>`;

          
          if (element.intentStatus) {
            const statusClass = (element.intentStatus)
              .toLowerCase()
              .replace(/\s+/g, '_');
            let statusText = $filter('humanize')(element.intentStatus);

            let statusIcon = 'fa-exclamation-triangle';
            const showIcon = attentionNeeded; // boolean
            const iconHtml = showIcon
              ? `<i class="fa ${statusIcon}"></i>`
              : '';
            htmlContent += `
                <div class="intentStatus padding-left-md padding-right-md width-fit-content font-size-14 text-capitalize bold">
                  ${statusText.toLowerCase()}
                </div>
              `;

            if(innerProgressLoader)
            innerProgressLoader.classList.add('zero-opacity');
          }
               
          div.innerHTML = htmlContent;
          fo.appendChild(div);
          fo.style.cursor = 'pointer';
          fo.style.pointerEvents = 'all';
          fo.data = element;

          /* -------- APPEND ORDER -------- */
          source.appendChild(bg);
          source.appendChild(fo);
        });
      }

      //close summary and show details 
      function showDetails(elem, _index){
        scope.showDetailsWindow({
          data: elem, 
          index: _index
        });
      }

      scope.$on('$destroy', function () {
        hypothesisDataWatch && hypothesisDataWatch();
        stepStatusWatch && stepStatusWatch();
      })
    }

    return directive;
  }
})();
