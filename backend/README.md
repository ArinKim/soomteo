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

```dockerfile
FROM gradle:8.10-jdk17-alpine
WORKDIR /app
VOLUME /home/gradle/.gradle
CMD ["./gradlew", "bootRun"]
```

* JAR 빌드 필요 없음 → `bootRun`으로 소스 그대로 실행
* Gradle 캐시를 호스트에 저장 → 빌드 속도 향상

### Node (backend/node/Dockerfile.dev)

```dockerfile
FROM node:18-alpine
WORKDIR /app
VOLUME /app/node_modules
CMD ["sh", "-c", "npm install && npm run dev"]
```

* 소스 마운트 + node_modules 분리 → hot reload 가능
* 개발 서버 바로 실행 가능

---

## 개발용 실행 가이드

1. 깃에서 코드 클론

```bash
git clone <repo-url>
cd project-root
```

2. docker-compose.dev.yml로 컨테이너 시작

```bash
docker compose -f docker-compose.dev.yml up --build
```

3. 브라우저 접속

* Spring Boot: [http://localhost:8080](http://localhost:8080)
* Node 서버: [http://localhost:8081](http://localhost:8081)

4. 코드 수정 → 자동 반영

* Spring: `src/main/java`, `src/main/resources` 수정 → bootRun 반영
* Node: `server.js` 등 수정 → dev 서버 반영

---

## 주의사항

* 호스트 포트 8080, 8081, 3306이 다른 프로세스와 충돌하지 않도록 주의
* MySQL 초기화 후 Spring Boot가 바로 연결 안 되면 컨테이너 재시작 필요
* Gradle, Node 캐시를 볼륨으로 분리 → 빌드 속도 유지

---


