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

import com.codenvy.api.license.data.LicenseDao;
import com.codenvy.api.license.data.LicenseData;

import org.eclipse.che.api.core.NotFoundException;
import org.eclipse.che.api.core.ServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
public class UsageManager {

    private static final Logger LOG = LoggerFactory.getLogger(UsageManager.class);

    //
    private final Map<String, LicenseType> licenseTypes;

    // id, license
    private final Map <String , License> runtimeLicenses;

    private final SessionRegistry sessionRegistry;

    private final LicenseDao licenseDao;


    @Inject
    public UsageManager(SessionRegistry sessionRegistry, LicenseDao licenseDao, Set <LicenseType> types) {



        this.licenseDao = licenseDao;

        this.sessionRegistry = sessionRegistry;

        this.licenseTypes = new HashMap<>();
        for(LicenseType type : types) {
            licenseTypes.put(type.getId(), type);
        }

        this.runtimeLicenses = new HashMap<>();
    }

    /**
     * called by resource consumer (machine service)
     * @param user
     * @param resources
     * @return
     */
    public ActiveSession start(String user, String licenseId, Set<Resource> resources) throws NotEnoughResourcesException,
                                                                                                ServerException, NotFoundException {

        License license = this.runtimeLicenses.get(licenseId);

        if(license == null) {

            LicenseData ld = this.licenseDao.get(licenseId);
            if(ld == null)
                throw new NotFoundException("No license found " + licenseId);

            LicenseType type = this.licenseTypes.get(ld.getType());
            if(type == null)
                throw new NotFoundException("No license type found  " + ld.getType());

            // create and add to runtime license instance
            license = type.createInstance(ld);
            runtimeLicenses.put(licenseId, license);

        }


        ActiveSession session = sessionRegistry.add(user, resources, license);

        return session;
    }

    /**
     * called by resource consumer (machine service)
     * @param sessionid
     */
    public void stop(String sessionId) throws NotFoundException {

        ActiveSession session = sessionRegistry.getActive(sessionId);
        session.getLicense().removeSession(sessionId);

        sessionRegistry.remove(sessionId);



    }


    public void check(String licenseType) throws NotFoundException {

        LicenseType type = this.licenseTypes.get(licenseType);
        if(type == null)
            throw new NotFoundException("No license type found  " + licenseType);

        List<String> licensesToPassivate = new ArrayList<>();
        for (License license : runtimeLicenses.values()) {

            if(!license.check())
                licensesToPassivate.add(license.getId());
        }

        // remove
        // todo need storing it to history
        for (String licenseId : licensesToPassivate) {

            for (ActiveSession session : runtimeLicenses.get(licenseId).getSessions())
                sessionRegistry.remove(session.getId());


            runtimeLicenses.remove(licenseId);
            licenseDao.delete(licenseId);
        }



    }

}
