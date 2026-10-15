/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('aiInvestigationDetails110Ctrl', aiInvestigationDetails110Ctrl);

  aiInvestigationDetails110Ctrl.$inject = ['$scope', '$rootScope', 'widgetBasePath', 'aiInvestigationDetailsService', 'FormEntityService', 'Modules', 'toaster', 'currentPermissionsService', 
    'settingsService', 'markdownEditorService', 'websocketService', 'picklistsService', '$uibModal', 'widgetService'];

  function aiInvestigationDetails110Ctrl($scope, $rootScope, widgetBasePath, aiInvestigationDetailsService, FormEntityService, Modules, toaster, currentPermissionsService, 
    settingsService, markdownEditorService, websocketService, picklistsService, $uibModal, widgetService) {

    $scope.botIcon = widgetBasePath + 'widgetAssets/images/bot.svg';
    $scope.currentTheme = $rootScope.theme.id+'_aiDetails';
    $scope.showInvestigationSections = false;
    $scope.stepStatus = aiInvestigationDetailsService.get('stepStatus') || '';
    $scope.feedbackText = '';
    $scope.feedbackAccepted = false;
    $scope.investigationErrorPresent = false;
    $scope.stepsData = [];
    $scope.showPhaseStatus = true;
    $scope.currentPhaseStatus = null;
    $scope.processingState = {
      isPhaseLoading: false,
      isHypothesisProcessing: false,
      isLogsProcessing: false,
      isSummaryProcessing: false
    };
    $scope.showSummaryWindow = true;
    if($scope.stepStatus==='completed' || $scope.stepStatus==='failed'){
      $scope.loadingResultData = true;
    }
    
    $scope.PATH_AI_HYPOTHESIS = widgetBasePath + 'widgetAssets/directives/aiHypothesis.html';
    $scope.PATH_AI_INVESTIGATION_STEPS = widgetBasePath + 'widgetAssets/directives/aiInvestigationSteps.html';
    $scope.PATH_AI_SUMMARY = widgetBasePath + 'widgetAssets/directives/aiSummary.html';
    $scope.AI_VERDICT = widgetBasePath + 'widgetAssets/directives/aiVerdict.html';
    $scope.AI_TAB_VERDICT = widgetBasePath + 'widgetAssets/directives/aiVerdictTabs.html';
    $scope.AI_PHASES = widgetBasePath + 'widgetAssets/directives/aiPhases.html';
    
    $scope.beginAIPowerAlertTriage = beginAIPowerAlertTriage;
    $scope.reInvestigateTriage = reInvestigateTriage;
    $scope.showHypothesisDetails = showHypothesisDetails;
    $scope.goBackToSummaryWindow = goBackToSummaryWindow;
    $scope.loadTraceFlow = loadTraceFlow;
    $scope.aiFeatureEnabled = false;

    let aiAgentsPermissions = currentPermissionsService.getPermission('ai_agents');
    $scope.aiAgentsPermissionsValid = aiAgentsPermissions.execute;

    $rootScope.triageInitialized = true;

    var triagetaskId = '';
    var entity, entityModule, entityId, entityData;
    var stepFailedPhasePresent;
    var webSocketSubscription;
    var publishedTimestamp = {
      stepUpdated: null,
      phasesUpdated: null
    };

    function getAIConsentStatus() {
      settingsService.getAIConsentStatus().then(function (response) {
        if (response) {
          $scope.aiFeatureEnabled = response;
          if ($scope.aiAgentsPermissionsValid) {
            getEntityDetails();
            aiInvestigationDetailsService.setWidgetBasePath(widgetBasePath);
          }
        }
      }).catch(function () {
        $scope.aiFeatureEnabled = false;
      });
    }

    function init() {
      getAIConsentStatus();
    }

    init();

    $scope.togglePhaseButton = function(){
      $scope.showPhaseStatus = !$scope.showPhaseStatus;
    }

    //ENTRY -->
    //fetch entity details
    //check if entity has taskId - fetch data as per taskID and show all sections data
    //else show start triage button on UI
    function getEntityDetails() {
      entity = FormEntityService.get();
      entityModule = entity?.module || '';
      entityId = entity?.id || '';
      let rawEntityData = entity.getData();
      entityData = JSON.parse(JSON.stringify(rawEntityData)); //remove undefined,infinity and NaN
      entityData.triagetaskid = entityData.triagetaskid; 
      checkTriageTaskStatus();
    }

    //if triagetaskid is available for the entity record 
    //then check the step status
    // if step status is completed fetch data through API {result}
    // else if in-progress start websocket
    function checkTriageTaskStatus() {
      if (entityData.triagetaskid) {
        $scope.showInvestigationSections = true;
        startProcessing();
        triagetaskId = angular.copy(entityData.triagetaskid);
        aiInvestigationDetailsService.getStepStatus(triagetaskId).then(function (response) {
          if (response && response.data && response.data.status) {
            $scope.stepStatus = response.data.status;
            aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
            aiInvestigationDetailsService.fetchAIInvestigationDetails(triagetaskId).then(function (response) {
                $scope.loadingResultData = false;
                updateInvestigationResultData(response.data);
                if ($scope.stepStatus === 'inprogress' || $scope.stepStatus === 'pending'){
                  fetchDataThroughInternalSocket();
                }else{
                  if($scope.stepStatus === 'failed'){
                    $scope.investigationErrorPresent = true;
                    $scope.investigationFailedMessage = 'Failed';
                  }
                  stopProcessing();
                }
            });
          }
        }, function (error) {
          $scope.stepStatus = 'failed';
          stopProcessing();
          $scope.loadingResultData = false;
          $scope.investigationErrorPresent = true;
          $scope.investigationFailedMessage =  error.data.message;
        });
      }
    }

    //IF no triagetaskId associated with alert then show begin triage button
    //on beginAIPowerAlertTriage button clicked
    function beginAIPowerAlertTriage() {
      $scope.showInvestigationSections = true;
      $scope.loadingResultData = false;
      reInvestigateTriage(); //initiate triage values and start triage
    }

    //createTaskId and assign it to entity and proceed to fetchDataThroughWebSocket 
    function startTriage() {
      aiInvestigationDetailsService
        .createTaskId(entityData)
        .then(function (response) {
          triagetaskId = angular.copy(response.data.task_id);
          if (!triagetaskId) {
            return;
          }
          // Update triage task id in module
          const promise = updateModuleFields({ triagetaskid:  angular.copy(response.data.task_id) });
          if (promise) {
            promise.then(
              function () {
                entity = FormEntityService.get();
                entity.fields['triagetaskid'].value = triagetaskId;
                FormEntityService.set(entity);
                fetchDataThroughInternalSocket();
                getEntityDetails();
              },
              function (error) {
                // handle update error
                $scope.stepStatus = 'failed';
                stopProcessing();
                closeWebSocket();
                $scope.investigationErrorPresent = true;
                $scope.investigationFailedMessage =  error.data.message;
              }
            );
          }
        }, function(error){
             $scope.stepStatus = 'failed';
              stopProcessing();
              closeWebSocket();
            $scope.investigationErrorPresent = true;
            $scope.investigationFailedMessage = error.data.message;
        });
    }

    function updateModuleFields(data) {
      return Modules.update(
        {
          module: entityModule,
          id: entityId
        },
        data
      ).$promise;
    }

    /* WEB SOCKET FUNCTION BLOCK */

    function closeWebSocket() {
      if(webSocketSubscription){
        websocketService.unsubscribe();
      }
    }

    function fetchDataThroughInternalSocket(){
      websocketService.subscribe(`ai-agent/${triagetaskId}`, function (response) {
        if (!response || !response.event) {
          stopProcessing();
          closeWebSocket();
          return;
        }
        updateSocketData(response);
        }).then(function (subsrciption) {
          webSocketSubscription = subsrciption;
        });
    }

    function updateSocketData(response){
      switch (response.event) {
          case 'hypothesis':
            if (response.data) {
              updateHypothesisData(response.data);
            }
            break;
          case 'hypothesis.update':
            if (response.data) {
              updateHypothesisData(response.data);
            }
            break;
          case 'step_generation':
            generateSteps(response.data.plan);
            break;
          case 'step_update':
            if (publishedTimestamp.stepUpdated === null || (publishedTimestamp.stepUpdated && response.published_at && (response.published_at >= publishedTimestamp.stepUpdated))) {
              publishedTimestamp.stepUpdated = response.published_at;
              executeStep(response.data);
            }
            break;
          case 'summary':
            if (response.data) {
              updateSummaryData(response.data);
            }
            break;
          case 'phase.update':
            if(response.phase){
              updatePhasesStatus(response.phase);
            }
            break;
          case 'phase.pending':
            $scope.stepStatus = 'pending';
            aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
            break;
          case 'task.in_progress':
            $scope.stepStatus = 'inprogress';
            aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
            break;
          case 'task.complete':
            $scope.stepStatus = 'completed';
            aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
            //If steps fail and summary is present //will remove when handled in backend
            if(stepFailedPhasePresent){
              aiInvestigationDetailsService.fetchAIInvestigationDetails(triagetaskId).then(function (response) {
                  if(response.data.logs){
                    $scope.stepsData = response.data.logs || [];
                    updateHypothesisData(response.data.hypotheses);
                    stopProcessing();
                  }
            },function(){
              stopProcessing();
            });
            }
            stopProcessing();
            closeWebSocket();
            break;
            case 'task.failed':
              $scope.stepStatus = 'failed';
              aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
              $scope.investigationErrorPresent = true;
              $scope.investigationFailedMessage = response.data.error;
              stopProcessing();
              closeWebSocket();
            break;
        }
    }

    function startProcessing(){
      $scope.processingState = {
        isPhaseLoading: true,
        isHypothesisProcessing: true,
        isLogsProcessing: true,
        isSummaryProcessing: true
      };
    }

    function stopProcessing(){
      $scope.processingState = {
        isHypothesisProcessing: false,
        isLogsProcessing: false,
        isSummaryProcessing: false
      };
    }

    function reInitializeResultData(){
      $scope.hypothesis = [];
      $scope.stepsData = [];
      $scope.finalSummary = [];
    }

    function reInvestigateTriage() {
      $scope.stepStatus = '';
      publishedTimestamp = {
        stepUpdated: null,
        phasesUpdated: null
      };
      aiInvestigationDetailsService.set('stepStatus', $scope.stepStatus);
      startProcessing();
      reInitializeResultData();
      $scope.investigationErrorPresent = false;
      $scope.phaseStatusList = null;
      stepFailedPhasePresent = false;
      startTriage(); //restart will create new task id 
    }

    //update all data present in RESULT 
    function updateInvestigationResultData(response) {
      if(response.hypotheses){
        updateHypothesisData(response.hypotheses);
      }
      if(response.logs){
        $scope.stepsData = response.logs || [];
        updateHypothesisData(response.hypotheses);
      }
      if(response.summary){
        updateSummaryData(response.summary);
        $scope.processingState.isSummaryProcessing = false;
      }
      if(response.phases){
        updatePhasesStatus(response.phases);
      }
    }
    
    // Triage overall phase status
    function updatePhasesStatus(statusData){
      $scope.processingState.isPhaseLoading = false;
      stepFailedPhasePresent = statusData.find(obj=>obj.status === 'failed');
      
      const filteredStatusData = Array.isArray(statusData) ? statusData.filter(({ data } = {}) => data !== null) : [];
      const oldList = Array.isArray($scope.phaseStatusList) ? $scope.phaseStatusList : [];
      const oldLength = oldList.length;
      const newLength = filteredStatusData.length;

      let updated_phases = []
      if (!oldLength && !newLength)  updated_phases = [];
      else if (!oldLength) updated_phases= filteredStatusData;
      else if (!newLength) updated_phases = oldList;
      else if (oldLength !== newLength) updated_phases = oldLength > newLength ? oldList : filteredStatusData;
      else {
        updated_phases = oldList.map((oldItem, index) => {
          const newItem = filteredStatusData[index];

          if (!oldItem) return newItem;
          if (!newItem) return oldItem;

          return oldItem.updated_at > newItem.updated_at ? oldItem : newItem;
        });
      }
      let updated_phases_len = updated_phases.length;

      if (updated_phases_len > 0 && updated_phases[updated_phases_len-1].status != 'inprogress'){
        updated_phases.push({ 'data': { 'message': 'Awaiting Next Phase ...' }, 'meta': {}, 'error': null, 'state': '', 'status': 'inprogress', 'started_at': '1778587217','updated_at': '1778587217'})         
      }
      $scope.phaseStatusList = updated_phases;
    }

    function updateHypothesisData(data) {
      $scope.hypothesis = angular.copy(data) || [];
      formatHypothesisData($scope.stepsData);
    }

    function updateSummaryData(data) {
      $scope.finalSummary = data || [];
      $scope.finalSummary.verdictColor = '#003f7f'; //default
      let _itemValue = $scope.finalSummary.classification;
      const _picklistName = 'AI Verdict';
      picklistsService.getPicklistByName(_picklistName).then(function (response) {
        if (response && response[0].picklists && _itemValue) {
          const picklists = response[0].picklists; 
          const itemValueColorMap = picklists.reduce((acc, item) => {
            acc[item.itemValue] = item.color;
            return acc;
          }, {});
          $scope.finalSummary.verdictColor = itemValueColorMap[_itemValue];
        }
      });
      if($scope.finalSummary.highlighted_summary){
        $scope.finalSummary.mdSummary = markdownEditorService.mdToHTML($scope.finalSummary.highlighted_summary);
      }
    }

    function generateSteps(newGeneratedSteps) {
      newGeneratedSteps.forEach(step => {
        if (!$scope.stepsData.some(old => old.uuid === step.uuid)) {
          $scope.stepsData.push(angular.copy(step));
        }
      });
    }

    function executeStep(newStepData) {
      if($scope.stepsData.length > 0){
        const index = $scope.stepsData.findIndex(step => step.uuid === newStepData.uuid);
        if (index !== -1) {
          $scope.stepsData[index] = newStepData;
        }
      }
      updateHypothesisExecutionData(newStepData);
    }

    //format hypothesis data to populate hypothesis from generate steps 
    function formatHypothesisData(_stepsData) {
      if ($scope.hypothesis.length > 0) {
        $scope.hypothesis.forEach(function (hypo) {
           // Create array if missing
            if (!hypo.supports) hypo.supports = [];
            if (!hypo.weakens) hypo.weakens = [];
            if (!hypo.questions) hypo.questions = [];

          if (_stepsData && _stepsData.length >0) {
            _stepsData.forEach(function (step) {
              if (step.weakens && step.weakens.includes(hypo.id)) {
                hypo.weakens.push(angular.copy(step));
              }
              if (step.supports && step.supports.includes(hypo.id)) {
                hypo.supports.push(angular.copy(step));
              }
              if((step.weakens_question && step.weakens_question.includes(hypo.id)) || (step.support_question && step.support_question.includes(hypo.id))){
                  hypo.questions.push(angular.copy(step));
              }
            })
          }
        })
      }
    }

    function updateHypothesisExecutionData(stepData) {
      if (!$scope.hypothesis || !$scope.hypothesis.length) return;

      $scope.hypothesis.forEach(function (hypo) {
        if (!hypo.supports) hypo.supports = [];
        if (!hypo.weakens) hypo.weakens = [];
        if (!hypo.questions) hypo.questions = [];

        //REMOVE old reference first (important for websocket updates)
        hypo.supports = hypo.supports.filter(s => s.uuid !== stepData.uuid);
        hypo.weakens = hypo.weakens.filter(s => s.uuid !== stepData.uuid);
        hypo.questions = hypo.questions.filter(q => q.uuid !== stepData.uuid);

        // ADD fresh mapping
        if (stepData.weakens && stepData.weakens.includes(hypo.id)) {
          hypo.weakens.push(angular.copy(stepData));
        }

        if (stepData.supports && stepData.supports.includes(hypo.id)) {
          hypo.supports.push(angular.copy(stepData));
        }

        if (
          (stepData.weakens_question && stepData.weakens_question.includes(hypo.id)) ||
          (stepData.support_question && stepData.support_question.includes(hypo.id))
        ) {
          hypo.questions.push(angular.copy(stepData));
        }
      });
    }

    function showHypothesisDetails(data, index){
      $scope.showSummaryWindow = false;
      $scope.currentHypothesisData = data;
      $scope.currentHypothesisData.hypoIndex = index;
    }

    function goBackToSummaryWindow(){
      $scope.showSummaryWindow = true;
    }

    let modalTheme = '';
    switch ($rootScope.theme.id) {
      case 'light':
      case 'dark': 
      case 'steel': 
        modalTheme = $rootScope.theme.id + '-aiAgentTraceability-trace-flow';
          break;
      default:
        modalTheme = 'aiAgentTraceability-trace-flow';
    }

    function loadTraceFlow(trace_id) {
      widgetService.getWidgetDef('aiAgentTraceability').then(function(response) {
        let _configTraceFlowModal = {
          animation: false,
          component: 'standaloneWidgetComponent',
          backdrop: 'static',
          windowClass: `fsr-standalone-modal modal-aiAgentTraceability-trace-flow ${ modalTheme }`,
          resolve: {
            definition: function() {
              return response;
            },
            config: function() {
              return {
                hideHeader: true,
                title: 'Trace Flow',
                trace_id: trace_id || angular.copy(entityData.triagetaskid)
              };
            }
          }
        };
        $uibModal.open(_configTraceFlowModal);
      }, function(error) {
        console.error(error);
      });
    }

    /* Summary key finding confidence class */
    $scope.getConfidenceClass = function (val) {
      if (val >= 0 && val <= 40) return 'conf-red';
      if (val > 50 && val <= 80) return 'conf-yellow';
      return 'conf-green'; // optional if confidence above 80 should be red
    };

    $scope.getImportanceOrder = function (item) {
      const priority = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      return priority[item.importance?.toLowerCase()] || 0;
    };

    $scope.$on('$destroy', function () {
      closeWebSocket();
    });

  }
})();