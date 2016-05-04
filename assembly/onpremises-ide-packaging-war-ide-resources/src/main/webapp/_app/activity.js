/*
 *  [2012] - [2016] Codenvy, S.A.
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Codenvy S.A. and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Codenvy S.A.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Codenvy S.A..
 */
var ActivityTracker = new function () {

    var url;
    var timeoutInterval = 10000;
    var maxErrors = 5;
    var active;

    this.init = function (restContext, workspaceId) {
        this.url = restContext + "/activity/" + workspaceId;
        ActivityTracker.initializeListeners();
        ActivityTracker.active = true;
    };

    this.sendRequest = function () {
        var request;
        if (window.XMLHttpRequest) {
            request = new XMLHttpRequest();
        } else {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        }

        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status != 204) {
                    maxErrors--;
                }

                if (maxErrors > 0) {
                    setTimeout(function () {
                        ActivityTracker.active = true;
                    }, timeoutInterval);
                }
            }
        };
        request.open("PUT", ActivityTracker.url, true);
        request.send();
    };

    this.handleEvent = function (e) {
        if (ActivityTracker.active) {
            ActivityTracker.sendRequest();
            ActivityTracker.active = false;
        }
    };

    this.initializeListeners = function () {
        document.addEventListener("mousemove", ActivityTracker.handleEvent);
        document.addEventListener("keypress", ActivityTracker.handleEvent);
    };
};
