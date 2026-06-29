package com.cloudcost.auth;

import com.cloudcost.auth.dto.LoginRequest;
import com.cloudcost.auth.dto.RegisterRequest;
import com.cloudcost.auth.entity.Role;
import com.cloudcost.auth.entity.User;
import com.cloudcost.auth.exception.AuthException;
import com.cloudcost.auth.repository.RefreshTokenRepository;
import com.cloudcost.auth.repository.UserRepository;
import com.cloudcost.auth.security.JwtService;
import com.cloudcost.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Auth Service Tests")
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L);
    }

    @Test
    @DisplayName("Should register new user successfully")
    void registersNewUser() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        req.setPassword("password123");
        req.setFirstName("John");
        req.setLastName("Doe");

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("encoded-pass");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(any())).thenReturn("jwt-token");
        when(jwtService.getExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("new@test.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw when email already exists")
    void throwsOnDuplicateEmail() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existing@test.com");
        req.setPassword("password");
        req.setFirstName("A"); req.setLastName("B");

        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("Should login and return tokens")
    void loginsSuccessfully() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("password");

        User user = User.builder()
                .id(1L).email("user@test.com").firstName("Test")
                .lastName("User").role(Role.USER).enabled(true).build();

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(jwtService.getExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
