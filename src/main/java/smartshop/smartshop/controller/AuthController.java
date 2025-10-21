package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.AuthDtos.*;
import smartshop.smartshop.model.User;
import smartshop.smartshop.service.UserService;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest req) {
        User u = new User();
        u.setFirstName(req.firstName());
        u.setLastName(req.lastName());
        u.setEmail(req.email());
        u.setPassword(req.password());
        return ResponseEntity.ok(userService.register(u));
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest req) {
        Optional<User> u = userService.login(req.email(), req.password());
        return u.map(ResponseEntity::ok).orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/initiate")
    public ResponseEntity<Void> initiate(@RequestBody InitiateRequest req) {
        userService.initiateEmailVerification(req.email(), req.purpose());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Boolean> verify(@RequestBody VerifyCodeRequest req) {
        return ResponseEntity.ok(userService.verifyCode(req.email(), req.purpose(), req.code()));
    }

    @PostMapping("/password/initiate")
    public ResponseEntity<Void> initiateReset(@RequestBody InitiateRequest req) {
        userService.initiatePasswordReset(req.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Boolean> reset(@RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(userService.resetPassword(req.email(), req.code(), req.newPassword()));
    }
}