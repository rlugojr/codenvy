package com.codenvy.api.license;

import org.eclipse.che.api.core.ServerException;
import org.eclipse.che.api.core.rest.shared.dto.ServiceError;

/**
 * @author gazarenkov
 */
public class NotEnoughResourcesException extends ServerException {

    public NotEnoughResourcesException(String message) {
        super(message);
    }

    public NotEnoughResourcesException(ServiceError serviceError) {
        super(serviceError);
    }

    public NotEnoughResourcesException(Throwable cause) {
        super(cause);
    }

    public NotEnoughResourcesException(String message, Throwable cause) {
        super(message, cause);
    }
}
