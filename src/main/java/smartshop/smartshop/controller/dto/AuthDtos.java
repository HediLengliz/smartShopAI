package smartshop.smartshop.controller.dto;

public class AuthDtos {
    public record RegisterRequest(String firstName, String lastName, String email, String password) {}
    public record LoginRequest(String email, String password) {}
    public record VerifyCodeRequest(String email, String purpose, String code) {}
    public record InitiateRequest(String email, String purpose) {}
    public record ResetPasswordRequest(String email, String code, String newPassword) {}
}

