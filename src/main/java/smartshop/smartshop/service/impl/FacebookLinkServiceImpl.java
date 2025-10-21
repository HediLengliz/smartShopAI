package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.FacebookLink;
import smartshop.smartshop.repository.FacebookLinkRepository;
import smartshop.smartshop.service.FacebookLinkService;

import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FacebookLinkServiceImpl implements FacebookLinkService {

    private final FacebookLinkRepository facebookLinkRepository;

    @Override
    public FacebookLink link(String userId, String facebookId, String accessToken) {
        FacebookLink link = facebookLinkRepository.findByUserId(userId).orElseGet(FacebookLink::new);
        link.setUserId(userId);
        link.setFacebookId(facebookId);
        link.setAccessToken(accessToken);
        if (link.getLinkedAt() == null) link.setLinkedAt(new Date());
        return facebookLinkRepository.save(link);
    }

    @Override
    public Optional<FacebookLink> get(String userId) {
        return facebookLinkRepository.findByUserId(userId);
    }

    @Override
    public void unlink(String userId) {
        facebookLinkRepository.findByUserId(userId).ifPresent(link -> facebookLinkRepository.deleteById(link.getId()));
    }
}


