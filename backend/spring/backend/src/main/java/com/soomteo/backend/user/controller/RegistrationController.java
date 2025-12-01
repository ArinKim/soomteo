package com.soomteo.backend.user.controller;

import com.soomteo.backend.user.dto.SignUpRequest;
import com.soomteo.backend.user.entity.Member;
import com.soomteo.backend.user.repository.MemberRepository;
import com.soomteo.backend.user.repository.UserDetailRepository;
import com.soomteo.backend.user.entity.UsersDetail;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class RegistrationController {

    private final MemberRepository memberRepository;
    private final UserDetailRepository userDetailRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SignUpRequest req) {
        try {
            if (req.getEmail() == null || req.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body("email is required");
            }

            if (req.getName() == null || req.getName().isEmpty()) {
                return ResponseEntity.badRequest().body("name is required");
            }

            if (req.getAge() == null) {
                return ResponseEntity.badRequest().body("age is required");
            }

            if (req.getGender() == null || req.getGender().isEmpty()) {
                return ResponseEntity.badRequest().body("gender is required");
            }

            if (req.getGuardianPhone() == null || req.getGuardianPhone().isEmpty()) {
                return ResponseEntity.badRequest().body("guardianPhone is required");
            }

            boolean isKakaoFlow = req.getKakaoId() != null;
            boolean emailExists = memberRepository.existsByEmail(req.getEmail());

            // Password required for normal signups. For Kakao signups, password is required
            // only when a new Member will be created (email does not already exist).
            if (!isKakaoFlow && (req.getPassword() == null || req.getPassword().isEmpty())) {
                return ResponseEntity.badRequest().body("password is required");
            }
            if (!isKakaoFlow && emailExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("email already exists");
            }

                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                String hashed = null;
                if (req.getPassword() != null && !req.getPassword().isEmpty()) {
                    hashed = encoder.encode(req.getPassword());
                }

                Member.MemberBuilder memberBuilder = Member.builder().email(req.getEmail());
                if (hashed != null) memberBuilder.password(hashed);

                Member member = memberBuilder
                    .name(req.getName())
                    .age(req.getAge())
                    .gender(req.getGender())
                    .guardianPhone(req.getGuardianPhone())
                    .profileImageUrl(req.getProfileImageUrl())
                    .build();

            // If signup comes from Kakao flow and includes a UsersDetail id, attempt to use the
            // same id for the Member row so the two tables share the id value.
            Long desiredId = req.getUserDetailId();
            Member saved;
            if (desiredId != null) {
                // If a member with that id already exists, treat as conflict
                if (memberRepository.existsById(desiredId)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body("member with given id already exists");
                }

                // Build with explicit id so DB insert uses that id.
                Member.MemberBuilder withIdBuilder = Member.builder().id(desiredId).email(req.getEmail());
                if (hashed != null) withIdBuilder.password(hashed);
                Member withId = withIdBuilder
                        .name(req.getName())
                        .age(req.getAge())
                        .gender(req.getGender())
                        .guardianPhone(req.getGuardianPhone())
                        .profileImageUrl(req.getProfileImageUrl())
                        .build();

                saved = memberRepository.save(withId);
            } else {
                if (isKakaoFlow && emailExists) {
                    // link to the existing account (don't overwrite password)
                    saved = memberRepository.findByEmail(req.getEmail()).orElse(memberRepository.save(member));
                } else {
                    saved = memberRepository.save(member);
                }
            }

            // If the client provided a userDetailId (already created), link it.
            if (req.getUserDetailId() != null) {
                UsersDetail userDetail = userDetailRepository.findById(req.getUserDetailId()).orElse(null);
                if (userDetail != null) {
                    userDetail.setUser(saved);
                    userDetailRepository.save(userDetail);
                }
            } else if (req.getKakaoId() != null) {
                // This is a Kakao-initiated signup and there was no existing usersDetail entry.
                // Create a new UsersDetail and link it to the saved member.
                // If a usersDetail with same kakaoId already exists, link to it instead.
                UsersDetail existing = userDetailRepository.findByKakaoId(req.getKakaoId()).orElse(null);
                if (existing != null) {
                    existing.setUser(saved);
                    userDetailRepository.save(existing);
                } else {
                    UsersDetail newDetail = UsersDetail.builder()
                            .kakaoId(req.getKakaoId())
                            .nickname(req.getName())
                            .email(req.getEmail())
                            .profileImageUrl(req.getProfileImageUrl())
                            .thumbnailImageUrl(req.getThumbnailImageUrl())
                            .user(saved)
                            .build();

                    userDetailRepository.save(newDetail);
                }
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("signup failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody com.soomteo.backend.user.dto.LoginRequest req) {
        try {
            if (req.getEmail() == null || req.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body("email is required");
            }
            if (req.getPassword() == null || req.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("password is required");
            }

            Member member = memberRepository.findByEmail(req.getEmail()).orElse(null);
            if (member == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid credentials");

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            if (!encoder.matches(req.getPassword(), member.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid credentials");
            }

            // successful login - return member info (password is ignored via @JsonIgnore)
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("login failed: " + e.getMessage());
        }
    }
}
