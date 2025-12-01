# 📌 프로젝트 개발용 환경 가이드

## 폴더 구조

```
project-root/
├─ docker-compose.dev.yml
└─ backend/
   ├─ node/
   │   ├─ package.json
   │   ├─ server.js
   │   └─ ... (소스 전체)
   │   └─ Dockerfile.dev
   └─ spring/
       ├─ build.gradle.kts
       ├─ settings.gradle.kts
       ├─ gradlew
       ├─ gradle/
       └─ src/
           ├─ main/
           │   ├─ java/
           │   └─ resources/
           └─ test/
       └─ Dockerfile.dev
```

### Spring (backend/spring/Dockerfile.dev)



### Node (backend/node/Dockerfile.dev)


---

## 개발용 실행 가이드

### 1. 프로젝트 클론
```bash
git clone 
cd project-root
```

### 2. Docker 컨테이너 시작
```bash
# 첫 실행 또는 Dockerfile 변경 시
docker-compose -f docker-compose.dev.yml up --build

# 이후 실행
docker-compose -f docker-compose.dev.yml up
```

### 3. 서비스 접속

- **Spring Boot API**: http://localhost:8080
- **Node.js 서버**: http://localhost:8081
- **MySQL**: localhost:3307


### 4. 데이터베이스 소스 설정
- 로컬 개발 (Spring 로컬 -> Docker MySQL)
```properties
spring.datasource.url=jdbc:mysql://localhost:3307/soomteo?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
spring.datasource.username=유저네임
spring.datasource.password=패스워드
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```
- allowPublicKeyRetrieval=true → MySQL 8+ 공개키 인증 문제 해결
- useSSL=false → 로컬 개발용


<br>

- 배포용 (Docker Spring -> Docker MySQL)
```properties
# 향후 배포용
jdbc:mysql://mysql:3306/soomteo?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Asia/Seoul
spring.datasource.url=jdbc:mysql://mysql:3306/soomteo?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Asia/Seoul
spring.datasource.username=유저네임
spring.datasource.password=패스워드
```
- 컨테이너끼리 통신할 때는 호스트명을 mysql 로 사용
- 포트는 3306 (컨테이너 내부 포트) 사용

---

## 주의사항

* 호스트 포트 8080, 8081, 3306이 다른 프로세스와 충돌하지 않도록 주의
* MySQL 초기화 후 Spring Boot가 바로 연결 안 되면 컨테이너 재시작 필요

---
