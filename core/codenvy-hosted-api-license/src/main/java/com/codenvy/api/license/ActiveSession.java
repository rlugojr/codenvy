package com.codenvy.api.license;

import java.util.Set;

/**
 * @author gazarenkov
 */
public class ActiveSession {

    private final String id;
    private final String user;
    private final long startTime;
    private final License license;
    private final Set<Resource> resources;


    public ActiveSession(String id, String user, License license, long startTime, Set<Resource> resources) {
        this.id = id;
        this.user = user;
        this.license = license;
        this.startTime = startTime;
        this.resources = resources;
    }

    public String getId() {
        return id;
    }

    public String getUser() {
        return user;
    }

    public long getStartTime() {
        return startTime;
    }

    public License getLicense() {
        return license;
    }

    public Set<Resource> getResources() {
        return resources;
    }
}
