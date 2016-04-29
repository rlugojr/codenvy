/*
 *  [2012] - [2016]
 *  Codenvy, S.A.
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
var AT = new function () {

    var restContext;
    var wsId;
    var timeout_interval = 1000;

    this.init = function (restContext, workspace) {
        this.restContext = restContext;
        this.wsId = workspace;
        document.addEventListener("mousemove", AT.handleMouseMove);
    };

    this.sendRequest = function () {
        var request;
        if (window.XMLHttpRequest) {
            request = new XMLHttpRequest();
        } else {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var url = AT.restContext + "/activity/" + AT.wsId;

        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 204) {
                document.addEventListener("mousemove", AT.handleMouseMove);
            }
        };
        request.open("PUT", url, true);
        request.send();
    };

    this.handleMouseMove = function(e) {
        document.removeEventListener("mousemove", AT.handleMouseMove);
        setTimeout(AT.sendRequest, timeout_interval);
    };
};
