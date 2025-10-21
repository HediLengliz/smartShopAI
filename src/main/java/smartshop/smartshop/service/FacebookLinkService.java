package smartshop.smartshop.service;

import smartshop.smartshop.model.FacebookLink;

import java.util.Optional;

public interface FacebookLinkService {
    FacebookLink link(String userId, String facebookId, String accessToken);
    Optional<FacebookLink> get(String userId);
    void unlink(String userId);
}

