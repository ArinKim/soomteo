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
docker-compose up --build

# 이후 실행
docker-compose up
```

### 3. 서비스 접속

- **Spring Boot API**: http://localhost:8080
- **Node.js 서버**: http://localhost:8081
- **MySQL**: localhost:3307

---

## 주의사항

* 호스트 포트 8080, 8081, 3306이 다른 프로세스와 충돌하지 않도록 주의
* MySQL 초기화 후 Spring Boot가 바로 연결 안 되면 컨테이너 재시작 필요

---


