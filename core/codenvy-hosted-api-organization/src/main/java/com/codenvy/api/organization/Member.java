package com.codenvy.api.organization;

import java.util.List;

/**
 * @author gazarenkov
 */
public interface Member {

    String getUser();

    String getOrganization();

    List<String> getPermittedActions();

}
