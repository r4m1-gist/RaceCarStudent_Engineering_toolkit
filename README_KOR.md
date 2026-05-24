# RaceCarStudent Engineering Toolkit

Formula Student Korea(FSK), Baja Student Korea(BSK), 학생 자작차 팀을 위한
웹 기반 엔지니어링 툴킷입니다.

팀원이 Python이나 CLI를 몰라도 브라우저에서 값을 입력하고 바로 결과를
볼 수 있게 만드는 것이 목표입니다.

## 개발 방향

이 프로젝트는 데모 파일과 배포 파일을 따로 나누지 않습니다.

같은 `web/` 파일을 사용해서:

- 로컬에서는 Python 정적 서버로 데모
- 나중에는 GitHub Pages로 배포

하는 방식으로 관리합니다.

## 폴더 구조

```text
web/
  index.html
  styles.css
  app.js
  assets/
calculators/
data_analysis/
templates/
examples/
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
- Chain Drive

`Data Analysis`는 별도 로그 분석 레포지토리인
`G-BungE_LogAnalysis_Modified_Mk.4`로 이어지는 입구 역할을 합니다.

## 로컬 데모 실행

프로젝트 루트에서 아래 명령어를 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8000/web/index.html
```

이 방식은 로컬 확인용 데모입니다. 실제 배포 때도 같은 `web/` 파일을
사용합니다.

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
- JavaScript: 계산 로직과 탭 전환
- Python: 로컬 데모 서버와 선택적 CLI 도구

Java가 아니라 JavaScript를 사용합니다. 이 프로젝트는 브라우저에서 바로
동작하는 정적 웹 앱 구조입니다.

## CLI 도구

`calculators/`와 `data_analysis/`에는 Python 기반 보조 도구도 들어 있습니다.
웹 앱이 기본 사용 흐름이고, CLI 도구는 계산식 검증이나 추가 분석용으로
사용할 수 있습니다.
