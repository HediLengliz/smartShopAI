package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.User;
import smartshop.smartshop.model.VerificationCode;
import smartshop.smartshop.repository.UserRepository;
import smartshop.smartshop.repository.VerificationCodeRepository;
import smartshop.smartshop.service.EmailService;
import smartshop.smartshop.service.UserService;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final EmailService emailService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    @Override
    public User register(User user) {
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        user.setActive(false);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        initiateEmailVerification(saved.getEmail(), "VERIFY_EMAIL");
        return saved;
    }

    @Override
    public Optional<User> login(String email, String rawPassword) {
        return userRepository.findByEmail(email)
                .filter(User::isActive)
                .filter(u -> passwordEncoder.matches(rawPassword, u.getPassword()));
    }

    @Override
    public void initiateEmailVerification(String email, String purpose) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        VerificationCode vc = new VerificationCode();
        vc.setEmail(email);
        vc.setPurpose(purpose);
        vc.setCode(code);
        vc.setCreatedAt(new Date());
        vc.setExpiresAt(new Date(System.currentTimeMillis() + 10 * 60 * 1000));
        vc.setUsed(false);
        userRepository.findByEmail(email).ifPresent(u -> vc.setUserId(u.getId()));
        codeRepository.save(vc);
        emailService.sendEmail(email, "Your verification code", "Code: " + code + " (10 min valid)");
    }

    @Override
    public boolean verifyCode(String email, String purpose, String code) {
        Optional<VerificationCode> vcOpt = codeRepository.findByEmailAndPurposeAndCodeAndUsedFalse(email, purpose, code);
        if (vcOpt.isEmpty()) return false;
        VerificationCode vc = vcOpt.get();
        if (vc.getExpiresAt() != null && vc.getExpiresAt().before(new Date())) {
            return false;
        }
        vc.setUsed(true);
        codeRepository.save(vc);
        if ("VERIFY_EMAIL".equals(purpose)) {
            userRepository.findByEmail(email).ifPresent(u -> { u.setActive(true); u.setUpdatedAt(new Date()); userRepository.save(u); });
        }
        return true;
    }

    @Override
    public void initiatePasswordReset(String email) {
        initiateEmailVerification(email, "RESET_PASSWORD");
    }

    @Override
    public boolean resetPassword(String email, String code, String newPassword) {
        boolean ok = verifyCode(email, "RESET_PASSWORD", code);
        if (!ok) return false;
        Optional<User> uOpt = userRepository.findByEmail(email);
        if (uOpt.isEmpty()) return false;
        User u = uOpt.get();
        u.setPassword(passwordEncoder.encode(newPassword));
        u.setUpdatedAt(new Date());
        userRepository.save(u);
        return true;
    }

    @Override
    public User updateProfile(User user) {
        user.setUpdatedAt(new Date());
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}

