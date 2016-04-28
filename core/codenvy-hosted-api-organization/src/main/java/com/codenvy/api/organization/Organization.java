package com.codenvy.api.organization;


import com.codenvy.api.license.License;

import java.util.List;
import java.util.Set;

/**
 * @author gazarenkov
 */
public interface Organization {

    String getName();

    List<Member> getMembers();

    Set<Organization> getChildren();

    Organization getParent();

    /**
     * @return whether the organization owns the licence (true) or the license was given by some other organization to use (false)
     */
    boolean isLicenseOwner();

    /**
     * @return the license organization uses
     */
    License getLicense();

}
