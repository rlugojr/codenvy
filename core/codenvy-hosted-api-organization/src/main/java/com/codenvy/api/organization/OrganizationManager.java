package com.codenvy.api.organization;


import com.codenvy.api.license.License;

import java.util.List;

/**
 * @author gazarenkov
 */
public class OrganizationManager {


    public Organization create(String name, License license, String primaryUserId) {
        return null;
    }

    public void remove(String organizationId) {

    }

    public Organization updateName(String name) {
        return null;
    }

    public Organization updateLicense(License license) {
        return null;
    }


    public Member addMember(String userId, String organizationId, List<String> actions) {
        return null;
    }

    public void removeMember(String memberId) {

    }

}
