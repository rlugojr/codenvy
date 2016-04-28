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
package com.codenvy.api.license;

import com.codenvy.api.license.data.LicenseData;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Instance of license
 * permit to use some resources
 * come with organizational (on-prem) or service providing (subscription) reason
 *
 * @author gazarenkov
 */
public abstract class License {

    private LicenseData data;

    private LicenseType type;

    private Map<String, ActiveSession> sessions;

    private Identity owner;

    License(LicenseData data, LicenseType type) {
        this.data = data;
        this.type = type;
        this.sessions = new HashMap<>();
        // todo
        this.owner = new Identity(data.getType().equalsIgnoreCase("user")?Identity.Type.USER:Identity.Type.ORG, data.getId());
    }

    public LicenseType getType() {
        return type;
    }

    public Set<ActiveSession> getSessions() {

        return new HashSet<>(sessions.values());
    }

    public void addSession(ActiveSession session) {

        sessions.put(session.getId(), session);
    }

    public void removeSession(String sessionId) {

        sessions.remove(sessionId);
    }

    public String getId() {
        return data.getId();
    }

    public Identity getOwner() {
        return owner;
    }

    /**
     * @return true if license is still active, false otherwise
     */
    public abstract boolean check();


}
