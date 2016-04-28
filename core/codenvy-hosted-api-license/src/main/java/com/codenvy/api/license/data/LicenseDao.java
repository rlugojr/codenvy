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

/**
 * @author gazarenkov
 */
public interface LicenseDao {

    /**
     * adds license
     * @param license
     */
    void add(LicenseData license);

    /**
     * deletes license by id
     * @param id
     */
    void delete(String id);

    /**
     * @param id the id
     * @return license data
     */
    LicenseData get(String id);

    /**
     * by account
     * @param license owner Id (account id)
     * @return license data
     */
    LicenseData getByOwner(String licenseeId);


}
