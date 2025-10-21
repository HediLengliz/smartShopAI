package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.FacebookDtos.*;
import smartshop.smartshop.model.FacebookLink;
import smartshop.smartshop.service.FacebookLinkService;

import java.util.Optional;

@RestController
@RequestMapping("/api/facebook")
@RequiredArgsConstructor
public class FacebookLinkController {

    private final FacebookLinkService facebookLinkService;

    @PostMapping("/link")
    public FacebookLink link(@RequestBody LinkRequest req) {
        return facebookLinkService.link(req.userId(), req.facebookId(), req.accessToken());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<FacebookLink> get(@PathVariable String userId) {
        Optional<FacebookLink> link = facebookLinkService.get(userId);
        return link.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unlink(@PathVariable String userId) {
        facebookLinkService.unlink(userId);
        return ResponseEntity.noContent().build();
    }
}
