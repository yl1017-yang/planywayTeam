# planywayTeam
https://yl1017-yang.github.io/planywayTeam/

## ✅ 프론트 - react

### 프로젝트 생성
npx create-react-app planyway

### 프론트 배포
npm install gh-pages --save-dev


--- package.json ----
"homepage": "https://yl1017-yang.github.io/planywayTeam/",
"predeploy": "npm run build",
"deploy": "gh-pages -d build"


## ✅ 백엔드 - Supabase 
https://supabase.com/


- Supabase sql - 이벤트테이블

create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  start_time timestamp not null,
  end_time timestamp not null,
  team text,
  label_id uuid null references labels(id),
  completed boolean default false,
  created_at timestamp default now()
);


- Supabase sql - 라벨테이블

create table labels (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  color text not null,
  created_at timestamp default now() 
);




## ✅ fullcalendar 플러그인
https://fullcalendar.io/docs/react

### 설치 명령
npm install @fullcalendar/react 
npm install @fullcalendar/timegrid 
npm install @fullcalendar/daygrid 
npm install @fullcalendar/interaction 
npm install @fullcalendar/list
npm install @supabase/supabase-js
npm install react-select


## ✅ 구글 Calendar API
Google Cloud Console 
API Key 생성(Google Cloud → “Calendar API” 활성화 → API Key 발급)

https://heejoo0503.tistory.com/56 //스크립형식 공휴일


### `npm start`
### `npm run deplay`