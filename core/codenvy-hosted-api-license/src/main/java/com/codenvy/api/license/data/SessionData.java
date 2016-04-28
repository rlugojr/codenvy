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
package com.codenvy.api.license.data;

import java.util.List;

/**
 * @author gazarenkov
 */
public class SessionData {

    private final String             id;
    private final String             userId;
    private final String             licenseId;
    private final long               startTime;
    private final List<ResourceData> resources;

    private long               stopTime;
    private String stopReason;

    public SessionData(String id, String userId, String licenseId, long startTime, List<ResourceData> resources) {

        this.id = id;
        this.userId = userId;
        this.licenseId = licenseId;
        this.startTime = startTime;
        this.resources = resources;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public long getStartTime() {
        return startTime;
    }

    public long getStopTime() {
        return stopTime;
    }

    public List<ResourceData> getResources() {
        return resources;
    }

    public String getStopReason() {
        return stopReason;
    }

    public void setStopTime(long stopTime) {
        this.stopTime = stopTime;
    }

    public void setStopReason(String stopReason) {
        this.stopReason = stopReason;
    }
}
