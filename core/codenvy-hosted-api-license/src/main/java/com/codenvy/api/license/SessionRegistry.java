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

import com.codenvy.api.license.data.SessionDao;
import com.codenvy.api.license.data.SessionData;

import org.eclipse.che.api.core.NotFoundException;
import org.eclipse.che.commons.lang.NameGenerator;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author gazarenkov
 */
@Singleton
public class SessionRegistry {

    private final  Map<String, ActiveSession> activeSessions;

    private final SessionDao sessionDao;

    @Inject
    public SessionRegistry(SessionDao sessionDao) {

        this.activeSessions = new HashMap<>();
        this.sessionDao = sessionDao;
    }

    public ActiveSession getActive(String id) throws NotFoundException {

        ActiveSession session = activeSessions.get(id);
        if (session == null)
            throw new NotFoundException("Session not found " + id);

        return session;
    }

    public SessionData getStored(String id) throws NotFoundException {

        SessionData data = sessionDao.get(id);
        if (data == null)
            throw new NotFoundException("Session not found " + id);

        return data;
    }

    public ActiveSession add(String user, Set<Resource> resources, License license) throws NotFoundException {

        String id = NameGenerator.generate("", 16);
        ActiveSession session = new ActiveSession(id, user, license, System.currentTimeMillis(), resources);


        activeSessions.put(id, session);
        license.addSession(session);
        sessionDao.add(session);

        return session;
    }

    public void remove(String id) {

        ActiveSession session = activeSessions.get(id);
        if (session != null)
            sessionDao.setStop(id, System.currentTimeMillis(), "setStop");
        activeSessions.remove(id);

    }

    public List<ActiveSession> getActiveByType(String licenseType) {

        List<ActiveSession> list = new ArrayList<>();

        for(ActiveSession session : activeSessions.values()) {
            if(session.getLicense().getType().getId().equals(licenseType))
                list.add(session);
        }

        return list;
    }


}
