# RaceCarStudent Engineering Toolkit

Formula Student Korea(FSK), Baja Student Korea(BSK), 학생 자작차 팀을 위한
정적 웹 데모입니다.

현재 툴킷은 HTML, CSS, JavaScript만 사용합니다. Python 런타임, 설치 과정,
빌드 과정, 백엔드 서버 없이 브라우저에서 바로 실행하는 구조입니다.

## 공개 데모

현재 GitHub Pages 주소는 아래입니다.

```text
https://r4m1-gist.github.io/RaceCarStudent_Engineering_Toolkit/
```

## 폴더 구조

```text
web/
  index.html
  styles.css
  app.js
  assets/
README.md
README_KOR.md
LICENSE
```

## 웹 앱 구성

현재 웹 앱은 아래 큰 탭으로 구성되어 있습니다.

- Intro
- Calculators
- Checklists
- Data Analysis

`Calculators` 안에는 아래 계산기가 들어갑니다.

- Brake Bias
- Spring Rate
- Motion Ratio
- Geometry Setup: CG, yaw rate
- Steering Setup: steering ratio, Ackermann
- Chain Drive

`Data Analysis`는 업로드한 로그, CSV, JSON, 숫자형 텍스트 파일을 브라우저
안에서 바로 파싱합니다. 파일은 서버로 전송하지 않고 현재 브라우저 세션에서만
처리합니다.

## 로컬 데모 실행

브라우저에서 아래 파일을 엽니다.

```text
web/index.html
```

정적 서버로 확인하고 싶다면 repository root를 서빙한 뒤 아래 주소를 엽니다.

```text
http://localhost:8000/web/index.html
```

## GitHub Pages 배포 방식

나중에 웹 주소를 받을 때는 GitHub Pages를 사용합니다.

기본 흐름:

1. 변경사항을 GitHub에 push
2. GitHub 저장소 `Settings`로 이동
3. `Pages` 메뉴 선택
4. `Deploy from a branch` 선택
5. 브랜치는 보통 `main` 선택
6. 소스 폴더는 repository root 선택
7. GitHub가 제공하는 Pages URL 접속

웹 앱 시작 파일은 아래입니다.

```text
web/index.html
```

## 기술 스택

- HTML: 화면 구조
- CSS: 디자인과 레이아웃
- JavaScript: 계산 로직, 탭 전환, 로그 파싱
