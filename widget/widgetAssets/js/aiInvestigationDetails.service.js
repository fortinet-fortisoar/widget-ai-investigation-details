/* Copyright start
  Copyright (C) 2008 - 2026 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/**
 * @ngdoc service
 * @name fortisoar.aiInvestigationDetailsService
 * @module fortisoar
 * @description
 *
 * The `aiInvestigationDetailsService` handles all the AI triage operations and investigates the detailed steps of alert record.
 *
 **/
(function () {
    angular
        .module('cybersponse')
        .factory('aiInvestigationDetailsService', aiInvestigationDetailsService);

    aiInvestigationDetailsService.$inject = ['$q', '$http'];

    function aiInvestigationDetailsService($q, $http) {
        var service;
        var widgetBasePath;
        const INVESTIGATION_API = '/api/ai/triage/';
        const INVESTIGATION_API_AGENT = '/api/ai/agents/';

        service = {
            getAlertData: getAlertData,
            createTaskId: createTaskId,
            getStepStatus: getStepStatus,
            fetchAIInvestigationDetails: fetchAIInvestigationDetails,
            fetchAgentList: fetchAgentList,
            getWidgetBasePath: getWidgetBasePath,
            setWidgetBasePath: setWidgetBasePath,
            set: set,
            get: get,
            clear: clear
        };

        let cache = {};

        function set(key, value) {
                cache[key] = value;
            }
            
        function get(key) {
                return cache[key];
            }

        function clear() {
            cache = {};
        }

        function getWidgetBasePath() {
            return widgetBasePath;
        }

        function setWidgetBasePath(_path) {
            widgetBasePath = _path;
        }

        function getAlertData(entityId){
            const queryUrl = `api/3/alerts/${entityId}`;
            return $http.get(queryUrl);
        }

        /**
            * @ngdoc method
            * @name fortisoar.aiInvestigationDetailsService#createTaskId
            * @methodOf fortisoar.aiInvestigationDetailsService
            *
            * @description
            * This method will return the task_id of the alert record created on starting the triage
            *
            * @param {String} alertId The task_id created on starting triage.
            * @returns {Promise} A promise that will be resolved with the task_id value.
        **/
        function createTaskId(entityData) {
            const queryUrl = `${INVESTIGATION_API}alert`;
            const queryParam = entityData;
            return $http.post(queryUrl, queryParam);
        }

        /**
            * @ngdoc method
            * @name fortisoar.aiInvestigationDetailsService#getStepStatus
            * @methodOf fortisoar.aiInvestigationDetailsService
            *
            * @description
            * This method will return the status of the investigation flowchart.
            *
            * @param {String} task_id The task_id created on starting triage.
            * @returns {Promise} A promise that will be resolved with the flowchart status
        **/
        function getStepStatus(task_id) {
            const queryUrl = `${INVESTIGATION_API_AGENT}${task_id}/status`;
            return $http.get(queryUrl);
        }

        /**
            * @ngdoc method
            * @name fortisoar.aiInvestigationDetailsService#fetchAIInvestigationDetails
            * @methodOf fortisoar.aiInvestigationDetailsService
            *
            * @description
            * This method will return the investigation detials of given task id for the selected Alert 
            *
            * @param {String} task_id The task_id created on starting triage.
            * @returns {Promise} A promise that will be resolved with the investigation details data
        **/
        function fetchAIInvestigationDetails(task_id) {
            const queryUrl = `${INVESTIGATION_API_AGENT}${task_id}/result`;
            return $http.get(queryUrl);
        }

        //fetch internal agent List 
        // need to update with API to fetch active agents - M_1290956
        function fetchAgentList() {
            const queryUrl = `${widgetBasePath}/widgetAssets/data/agentList.json`;
            return $http.get(queryUrl);
        }

        return service;
    }
})();
