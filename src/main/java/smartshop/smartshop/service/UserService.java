package smartshop.smartshop.service;

import smartshop.smartshop.model.User;

import java.util.Optional;

public interface UserService {
    User register(User user);
    Optional<User> login(String email, String rawPassword);
    void initiateEmailVerification(String email, String purpose);
    boolean verifyCode(String email, String purpose, String code);
    void initiatePasswordReset(String email);
    boolean resetPassword(String email, String code, String newPassword);
    User updateProfile(User user);
    Optional<User> findByEmail(String email);
}

