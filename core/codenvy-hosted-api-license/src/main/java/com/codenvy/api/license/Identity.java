package com.codenvy.api.license;

/**
 *
 * Identity: User or Organization
 *
 * TEMPORARY HERE
 * todo move to appropriate place
 *
 * @author gazarenkov
 */
public class Identity {

    public enum Type {
        USER,
        ORG
    };

    private final Type type;
    private final String id;


    public Identity(final Type type, final String id) {

        this.type = type;
        this.id = id;
    }

    public Type getType() {
        return type;
    }

    public String getId() {
        return id;
    }


}
