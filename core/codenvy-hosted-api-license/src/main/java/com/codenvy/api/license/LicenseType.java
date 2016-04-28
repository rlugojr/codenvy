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

/**
 * Type of license, describes license and is a factory for license instance
 *
 * @author gazarenkov
 */
public interface LicenseType {

    /**
     * @return id
     */
    String getId();

    /**
     * @return human readable description
     */
    String getDescription();

    /**
     * factory method for instance creating
     * @return
     */
    License createInstance(LicenseData licenseData);

}
